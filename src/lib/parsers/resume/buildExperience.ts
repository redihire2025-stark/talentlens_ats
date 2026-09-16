import type { ExperienceEntry } from '@/types/resume'
import { isBulletLine, stripBulletMarker } from './blocks'
import { splitByDateBoundary } from './dateBoundaryBlocks'
import { extractDateRange } from './dateUtils'
import { extractLocation } from './fieldExtractors'

const TITLE_KEYWORD_RE =
  /\b(engineer|manager|developer|director|designer|analyst|lead|specialist|consultant|architect|intern|coordinator|officer|president|founder|scientist|administrator)\b/i

const META_SEPARATOR_RE = /\s*(?:\||–|—|\bat\b|,)\s*/

interface MetaParseResult {
  title: string
  company: string
  location: string | null
  startDate: string | null
  endDate: string | null
}

function parseMetaLines(metaLines: string[], warnings: string[], entryIndex: number): MetaParseResult {
  let text = metaLines.join(' — ')
  let startDate: string | null = null
  let endDate: string | null = null

  for (const line of metaLines) {
    const range = extractDateRange(line)
    if (range) {
      startDate = range.startDate
      endDate = range.endDate
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

  const parts = text
    .split(META_SEPARATOR_RE)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length === 0) {
    warnings.push(`Experience entry ${entryIndex + 1}: couldn't identify a title or company.`)
    return { title: '', company: '', location, startDate, endDate }
  }

  if (parts.length === 1) {
    warnings.push(`Experience entry ${entryIndex + 1}: couldn't separate the title from the company.`)
    return { title: parts[0]!, company: '', location, startDate, endDate }
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
    return { title: first, company: rest.join(', '), location, startDate, endDate }
  }

  const title = parts[titleIndex]!
  const company = parts.filter((_, i) => i !== titleIndex).join(', ')
  return { title, company, location, startDate, endDate }
}

/**
 * Parses one blank-line-separated block into an experience entry. The
 * lines before the first bullet are treated as "meta" (title/company/
 * location/dates); everything from the first bullet onward is a bullet.
 * See docs/architecture/resume-parser.md for the supported conventions and
 * known limitations of this heuristic.
 */
function parseExperienceBlock(block: string[], warnings: string[], entryIndex: number): ExperienceEntry {
  const firstBulletIndex = block.findIndex(isBulletLine)
  const metaLines = firstBulletIndex === -1 ? block.slice(0, 1) : block.slice(0, firstBulletIndex)
  const bulletLines = firstBulletIndex === -1 ? block.slice(1) : block.slice(firstBulletIndex)

  const meta = parseMetaLines(metaLines, warnings, entryIndex)
  const bullets = bulletLines.map(stripBulletMarker).filter(Boolean)

  return {
    company: meta.company,
    title: meta.title,
    startDate: meta.startDate,
    endDate: meta.endDate,
    location: meta.location,
    bullets,
  }
}

export function buildExperience(experienceLines: string[], warnings: string[]): ExperienceEntry[] {
  return splitByDateBoundary(experienceLines).map((block, index) => parseExperienceBlock(block, warnings, index))
}
