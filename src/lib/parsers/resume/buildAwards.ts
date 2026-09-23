import type { AwardEntry } from '@/types/resume'
import { buildAwardEntry } from '@/lib/schema/resumeBuilders'
import { stripBulletMarker } from './blocks'
import { extractDateRange } from './dateUtils'

const TITLE_ISSUER_SEPARATOR_RE = /\s+[-–—]\s+|,\s+|\s+\|\s+/

/**
 * Each non-blank line of an "Awards"/"Honors" section is one award — the
 * same one-line-per-entry convention `buildCertifications` uses. A date,
 * when present, is read with the shared date parser (its start date); the
 * text before the first separator is the title and the text after it the
 * issuer, when there is one. Nothing is inferred beyond the line itself.
 */
export function buildAwards(lines: string[]): AwardEntry[] {
  return lines
    .map(stripBulletMarker)
    .filter(Boolean)
    .map((line, index) => {
      let text = line
      let date: string | null = null
      const range = extractDateRange(line)
      if (range) {
        date = range.startDate
        text = text.replace(range.matchedText, ' ')
      }
      text = text.replace(/\(\s*\)/g, ' ').replace(/\s{2,}/g, ' ').replace(/[\s,|–—-]+$/, '').trim()

      const [title, ...rest] = text.split(TITLE_ISSUER_SEPARATOR_RE).map((part) => part.trim()).filter(Boolean)
      return buildAwardEntry({ title: title ?? text, issuer: rest.length > 0 ? rest.join(', ') : null, date, sourceLine: line }, index)
    })
}
