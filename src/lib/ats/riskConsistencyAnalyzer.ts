import type { ExperienceEntry } from '@/types/resume'
import type { AnalyzerResult, AtsAnalysisInput } from './types'

/**
 * Risk & Consistency (PRD §11): checks computable purely from the already
 * parsed Resume JSON — no new infrastructure needed. This deliberately does
 * NOT try to judge whether an overlap or gap is a problem (career changes,
 * part-time work, and freelancing overlaps are all legitimate) — it only
 * surfaces what a human reviewer (or a real ATS) would also notice, so the
 * candidate can decide whether it needs a clarifying line on the resume.
 */

interface DatedEntry {
  entry: ExperienceEntry
  start: Date | null
  end: Date | null
}

function toDate(value: string | null): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function toDatedEntries(experience: ExperienceEntry[]): DatedEntry[] {
  return experience.map((entry) => ({
    entry,
    start: toDate(entry.startDate),
    end: entry.endDate ? toDate(entry.endDate) : new Date(),
  }))
}

function rangesOverlap(a: DatedEntry, b: DatedEntry): boolean {
  if (!a.start || !b.start) return false
  const aEnd = a.end ?? new Date()
  const bEnd = b.end ?? new Date()
  return a.start < bEnd && b.start < aEnd
}

/** An entry's own end date is before its start date — internally inconsistent, not just "unusual". */
function findInvertedRanges(entries: DatedEntry[]): ExperienceEntry[] {
  return entries.filter((d) => d.start && d.end && d.end < d.start).map((d) => d.entry)
}

/** Two different roles whose date ranges overlap by more than a short, plausible transition window. */
function findOverlaps(entries: DatedEntry[]): [ExperienceEntry, ExperienceEntry][] {
  const overlaps: [ExperienceEntry, ExperienceEntry][] = []
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i]!
      const b = entries[j]!
      if (a.entry.company === b.entry.company && a.entry.title === b.entry.title) continue
      if (rangesOverlap(a, b)) overlaps.push([a.entry, b.entry])
    }
  }
  return overlaps
}

/** Identical company+title repeated with different, non-overlapping dates is normal (a rehire); repeated *and* overlapping is a likely duplicate entry. */
function findDuplicateEntries(entries: DatedEntry[]): ExperienceEntry[] {
  const duplicates: ExperienceEntry[] = []
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i]!
      const b = entries[j]!
      if (a.entry.company === b.entry.company && a.entry.title === b.entry.title && rangesOverlap(a, b)) {
        duplicates.push(b.entry)
      }
    }
  }
  return duplicates
}

const URL_LIKE_RE = /^(https?:\/\/|www\.)[^\s]+\.[a-z]{2,}/i

function findMalformedLinks(links: { type: string; url: string }[]): string[] {
  return links.filter((link) => link.url.trim().length > 0 && !URL_LIKE_RE.test(link.url.trim())).map((link) => link.url)
}

export function analyzeRiskConsistency({ resume }: AtsAnalysisInput): AnalyzerResult {
  const dated = toDatedEntries(resume.experience)
  const inverted = findInvertedRanges(dated)
  const overlaps = findOverlaps(dated)
  const duplicates = findDuplicateEntries(dated)
  const malformedLinks = findMalformedLinks(resume.candidate.links)

  const strengths: string[] = []
  const issues: string[] = []
  let penalty = 0

  if (inverted.length > 0) {
    issues.push(`${inverted.length} experience ${inverted.length === 1 ? 'entry has' : 'entries have'} an end date earlier than its start date.`)
    penalty += inverted.length * 25
  }

  if (duplicates.length > 0) {
    issues.push(`${duplicates.length} experience ${duplicates.length === 1 ? 'entry looks like a duplicate' : 'entries look like duplicates'} of the same role and company with overlapping dates.`)
    penalty += duplicates.length * 20
  } else if (overlaps.length > 0) {
    issues.push(
      `${overlaps.length} pair${overlaps.length === 1 ? '' : 's'} of roles have overlapping employment dates (e.g. "${overlaps[0]![0].title}" at ${overlaps[0]![0].company} and "${overlaps[0]![1].title}" at ${overlaps[0]![1].company}) — this may be intentional (part-time, freelance, board work) but is worth double-checking.`,
    )
    penalty += Math.min(20, overlaps.length * 10)
  }

  if (malformedLinks.length > 0) {
    issues.push(`${malformedLinks.length} link(s) do not look like valid URLs: ${malformedLinks.join(', ')}.`)
    penalty += malformedLinks.length * 10
  }

  if (issues.length === 0) {
    strengths.push('No date conflicts, overlapping employment, duplicate entries, or malformed links were detected.')
  }

  const score = Math.max(0, 100 - penalty)

  return {
    score,
    strengths,
    issues,
    explanation:
      issues.length === 0
        ? 'Employment dates and links are internally consistent.'
        : `${issues.length} consistency risk${issues.length === 1 ? '' : 's'} found — these are worth reviewing, not necessarily errors.`,
  }
}
