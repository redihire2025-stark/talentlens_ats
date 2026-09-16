import type { Certification } from '@/types/resume'
import { stripBulletMarker } from './blocks'
import { extractDateRange } from './dateUtils'

/** Each non-blank line is treated as one certification — resumes rarely wrap a single credential across lines. */
export function buildCertifications(lines: string[]): Certification[] {
  return lines
    .map(stripBulletMarker)
    .filter(Boolean)
    .map((line) => {
      let text = line
      let issueDate: string | null = null
      let expirationDate: string | null = null

      const range = extractDateRange(line)
      if (range) {
        issueDate = range.startDate
        expirationDate = range.endDate
        text = text.replace(range.matchedText, '').trim()
      }
      text = text.replace(/\(\s*\)/, '').replace(/\s{2,}/g, ' ').trim()

      const [name, issuer] = text
        .split(/\s*(?:-|–|—|,)\s*/)
        .map((part) => part.trim())
        .filter(Boolean)

      return {
        name: name ?? text,
        issuer: issuer ?? null,
        issueDate,
        expirationDate,
      }
    })
}
