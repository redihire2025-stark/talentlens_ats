import type { ExperienceEntry } from '@/types/resume'
import { buildExperienceEntry } from '@/lib/schema/resumeBuilders'
import { isBulletLine, mergeWrappedBulletLines } from './blocks'
import { splitByDateBoundary } from './dateBoundaryBlocks'
import { extractDateRange } from './dateUtils'
import { extractLocation } from './fieldExtractors'

const TITLE_KEYWORD_RE =
  /\b(engineer|manager|developer|director|designer|analyst|lead|specialist|consultant|architect|intern|coordinator|officer|president|founder|scientist|administrator)\b/i

/**
 * Punctuation-based separators between a title and a company on the same
 * meta line. Covers pipe, en/en-dash, em-dash, "@" (very common on
 * LinkedIn-exported resumes: "Senior Engineer @ Acme"), a plain hyphen with
 * spaces on both sides ("Senior Engineer - Acme" — deliberately requires
 * surrounding whitespace so it never splits a hyphenated word like
 * "Full-Stack"), "at" (case-insensitive), a comma, or a semicolon. See
 * docs/architecture/resume-parser.md.
 */
const META_SEPARATOR_RE = /\s+-\s+|\s*(?:\||–|—|@|\bat\b|,|;)\s*/i

/**
 * Fallback for a meta line with no punctuation separator at all — common
 * when a PDF's title/company columns were extracted as plain whitespace
 * (e.g. "Senior Engineer    Acme Corp" or a literal tab). Requires at least
 * two consecutive spaces (or a tab) so ordinary single-spaced prose is
 * never mistakenly split.
 */
const WHITESPACE_COLUMN_SEPARATOR_RE = /\t+| {2,}/

interface MetaParseResult {
  title: string
  company: string
  location: string | null
  startDate: string | null
  endDate: string | null
  /** True only when the matched date range literally says Present/Current/Now. */
  isCurrent: boolean
  warnings: string[]
}

const PRESENT_WORD_RE = /\b(present|current|now)\b/i

function parseMetaLines(metaLines: string[], entryIndex: number): MetaParseResult {
  let text = metaLines.join(' — ')
  let startDate: string | null = null
  let endDate: string | null = null
  let isCurrent = false
  const warnings: string[] = []

  for (const line of metaLines) {
    const range = extractDateRange(line)
    if (range) {
      startDate = range.startDate
      endDate = range.endDate
      isCurrent = range.endDate === null && PRESENT_WORD_RE.test(range.matchedText)
      text = text.replace(range.matchedText, ' ')
      break
    }
  }

  const location = extractLocation(metaLines)
  if (location) {
    text = text.replace(location, ' ')
  }

  // A date range (or location) is often wrapped in parentheses in the
  // source line — e.g. "Backend Engineer, Acme Corp (2020 - Present)" —
  // and only the date/location text itself is removed above, leaving an
  // empty "()" behind that would otherwise get glued onto the next part.
  text = text.replace(/\(\s*\)/g, ' ')

  let parts = text
    .split(META_SEPARATOR_RE)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length === 1) {
    // No punctuation separator found — try the whitespace-columns fallback
    // before giving up (see WHITESPACE_COLUMN_SEPARATOR_RE above).
    const columnParts = parts[0]!
      .split(WHITESPACE_COLUMN_SEPARATOR_RE)
      .map((part) => part.trim())
      .filter(Boolean)
    if (columnParts.length > 1) parts = columnParts
  }

  if (parts.length === 0) {
    warnings.push(`Experience entry ${entryIndex + 1}: couldn't identify a title or company.`)
    return { title: '', company: '', location, startDate, endDate, isCurrent, warnings }
  }

  if (parts.length === 1) {
    warnings.push(`Experience entry ${entryIndex + 1}: couldn't separate the title from the company.`)
    return { title: parts[0]!, company: '', location, startDate, endDate, isCurrent, warnings }
  }

  // A company name can itself contain a separator ("Acme, Inc.", "Foo |
  // Bar Holdings"), so once the line is split into more than two parts we
  // can't assume "first part = title, second part = company" — that would
  // silently drop everything past the second part. Instead, find whichever
  // part reads like a job title and treat every other part, rejoined in
  // its original order, as the company.
  const titleIndex = parts.findIndex((part) => TITLE_KEYWORD_RE.test(part))

  if (titleIndex === -1) {
    // No part reads like a title — fall back to the "Title, Company"
    // convention: the first part is the title, everything after it
    // (rejoined) is the company, so a multi-part company name still
    // survives intact instead of being truncated to its second segment.
    const [first, ...rest] = parts as [string, ...string[]]
    return { title: first, company: rest.join(', '), location, startDate, endDate, isCurrent, warnings }
  }

  const title = parts[titleIndex]!
  const company = parts.filter((_, i) => i !== titleIndex).join(', ')
  return { title, company, location, startDate, endDate, isCurrent, warnings }
}

/**
 * Parses one blank-line-separated block into an experience entry. The
 * lines before the first bullet are treated as "meta" (title/company/
 * location/dates); everything from the first bullet onward is a bullet.
 * The meta lines become the entry's evidence; each bullet becomes an
 * `ExperienceBullet` entity (see `buildExperienceBullet`). See
 * docs/architecture/resume-parser.md for the supported conventions and
 * known limitations of this heuristic.
 */
function parseExperienceBlock(block: string[], warnings: string[], entryIndex: number): ExperienceEntry {
  const firstBulletIndex = block.findIndex(isBulletLine)
  const metaLines = firstBulletIndex === -1 ? block.slice(0, 1) : block.slice(0, firstBulletIndex)
  const bulletLines = firstBulletIndex === -1 ? block.slice(1) : block.slice(firstBulletIndex)

  const meta = parseMetaLines(metaLines, entryIndex)
  warnings.push(...meta.warnings)

  return buildExperienceEntry(
    {
      company: meta.company,
      title: meta.title,
      startDate: meta.startDate,
      endDate: meta.endDate,
      isCurrent: meta.isCurrent,
      location: meta.location,
      bullets: mergeWrappedBulletLines(bulletLines),
      metaLines: metaLines.map((line) => line.trim()).filter(Boolean),
      warnings: meta.warnings,
    },
    entryIndex,
  )
}

export function buildExperience(experienceLines: string[], warnings: string[]): ExperienceEntry[] {
  return splitByDateBoundary(experienceLines).map((block, index) => parseExperienceBlock(block, warnings, index))
}
