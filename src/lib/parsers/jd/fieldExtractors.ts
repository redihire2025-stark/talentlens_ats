import type { EmploymentType, ExperienceRequirement } from '@/types/jobDescription'
import { stripSeniorityPrefix } from '@/lib/normalization/titleSeniority'

const TITLE_LABEL_RE = /^(?:job title|title|position|role)\s*:\s*(.+)$/i
const LOCATION_LABEL_RE = /^location\s*:\s*(.+)$/i
/** Same trade-off as the resume parser's location pattern: a strict 2-letter code avoids false matches. */
const LOCATION_RE = /\b([A-Z][a-zA-Z.]+(?:\s+[A-Z][a-zA-Z.]+){0,2}),\s*([A-Z]{2})\b/

export function extractTitle(headerLines: string[]): string | null {
  for (const line of headerLines) {
    const match = line.match(TITLE_LABEL_RE)
    if (match) return match[1]!.trim()
  }
  const firstLine = headerLines.map((l) => l.trim()).find((l) => l.length > 0)
  if (firstLine && firstLine.length <= 80 && !firstLine.endsWith('.')) return firstLine
  return null
}

export function extractLocation(text: string): string | null {
  for (const line of text.split('\n')) {
    const labelMatch = line.match(LOCATION_LABEL_RE)
    if (labelMatch) return labelMatch[1]!.trim()
  }
  if (/\bremote\b/i.test(text)) return 'Remote'
  return text.match(LOCATION_RE)?.[0] ?? null
}

const EMPLOYMENT_TYPE_PATTERNS: [pattern: RegExp, type: EmploymentType][] = [
  [/\bfull[\s-]?time\b/i, 'full-time'],
  [/\bpart[\s-]?time\b/i, 'part-time'],
  [/\bcontract(?:or)?\b/i, 'contract'],
  [/\bintern(?:ship)?\b/i, 'internship'],
  [/\btemporary\b/i, 'temporary'],
]

export function extractEmploymentType(text: string): EmploymentType | null {
  for (const [pattern, type] of EMPLOYMENT_TYPE_PATTERNS) {
    if (pattern.test(text)) return type
  }
  return null
}

const YEARS_RANGE_RE = /\b(\d{1,2})\s*(?:-|to)\s*(\d{1,2})\+?\s*years?\b/i
const YEARS_PLUS_RE = /\b(\d{1,2})\+\s*years?\b/i
const YEARS_MIN_ONLY_RE = /\b(\d{1,2})\s*years?\b/i

/**
 * Looks for "N+ years", "N-M years", or a plain "N years" mention anywhere
 * in the text. This is a best-effort scan, not a guarantee — a JD that
 * mentions an unrelated "5 years" (e.g. "5 years running this program")
 * would be misread as an experience requirement. Refining this with real
 * context (proximity to "experience") is a candidate for a later pass, not
 * a V1 blocker: an over-read experience requirement fails safe, since the
 * experience matcher (TASK-009) only ever reports a gap, never fabricates
 * evidence the resume doesn't show.
 */
/** Seniority words that can stand alone in prose ("This is a Senior-level role"), not just as a title prefix. */
const SENIORITY_WORD_RE = /\b(intern(?:ship)?|entry[\s-]?level|junior|jr\.?|mid[\s-]?level|senior|sr\.?|staff|principal|lead|manager)\b/i

/**
 * Prefers a recognized prefix on the extracted title ("Senior Frontend
 * Engineer" → "senior") since that's the most reliable signal; falls back
 * to scanning the whole document for a standalone seniority word (e.g. a
 * "Level: Senior" line, or "This is a senior role") when the title doesn't
 * carry one.
 */
export function extractSeniority(title: string | null, text: string): string | null {
  if (title) {
    const { seniority } = stripSeniorityPrefix(title)
    if (seniority) return seniority
  }
  const match = text.match(SENIORITY_WORD_RE)
  if (!match) return null
  const { seniority } = stripSeniorityPrefix(match[0])
  return seniority
}

/** Excludes acronyms too generic to count as a JD "domain term" even when they appear repeatedly. */
const DOMAIN_ACRONYM_STOPLIST = new Set([
  'CEO', 'CTO', 'CFO', 'COO', 'VP', 'HR', 'PM', 'PR', 'US', 'USA', 'UK', 'EU', 'ID', 'OK', 'FAQ', 'TBD', 'ASAP', 'EOD', 'EOW',
])

/**
 * Conservative domain-term mining: a bare all-caps acronym (HIPAA, SOC2,
 * GDPR, PCI, SLA, KPI, ROI, …) mentioned more than once is very likely
 * meaningful domain jargon, not incidental capitalization — a single
 * mention is too easy to catch a stray abbreviation or a section heading
 * remnant. Anything already captured as a skill/technology is excluded so
 * domain terms don't just duplicate the skills list.
 */
export function extractDomainTerms(text: string, exclude: ReadonlySet<string>): string[] {
  const counts = new Map<string, number>()
  for (const match of text.matchAll(/\b[A-Z]{2,6}[0-9]?\b/g)) {
    const term = match[0]
    if (DOMAIN_ACRONYM_STOPLIST.has(term)) continue
    if (exclude.has(term.toLowerCase())) continue
    counts.set(term, (counts.get(term) ?? 0) + 1)
  }
  return [...counts.entries()].filter(([, count]) => count >= 2).map(([term]) => term)
}

export function extractExperienceRequirement(text: string): ExperienceRequirement {
  const rangeMatch = text.match(YEARS_RANGE_RE)
  if (rangeMatch) {
    return { minimumYears: Number(rangeMatch[1]), maximumYears: Number(rangeMatch[2]) }
  }
  const plusMatch = text.match(YEARS_PLUS_RE)
  if (plusMatch) {
    return { minimumYears: Number(plusMatch[1]), maximumYears: null }
  }
  const minOnlyMatch = text.match(YEARS_MIN_ONLY_RE)
  if (minOnlyMatch) {
    return { minimumYears: Number(minOnlyMatch[1]), maximumYears: null }
  }
  return { minimumYears: null, maximumYears: null }
}
