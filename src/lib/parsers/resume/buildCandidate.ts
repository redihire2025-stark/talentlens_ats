import type { Candidate } from '@/types/resume'
import { extractEmail, extractLinks, extractLocation, extractName, extractPhone } from './fieldExtractors'

export function buildCandidate(headerLines: string[]): Candidate {
  const headerText = headerLines.join('\n')
  return {
    name: extractName(headerLines),
    email: extractEmail(headerText),
    phone: extractPhone(headerText),
    location: extractLocation(headerLines),
    links: extractLinks(headerText),
  }
}

/**
 * Falls back to the header block for a summary when there's no explicit
 * "Summary" section: any header lines left over once the name, contact
 * info, and links are accounted for are assumed to be a summary paragraph.
 */
export function buildSummary(headerLines: string[], summaryLines: string[], candidate: Candidate): string | null {
  const explicit = summaryLines.join(' ').trim()
  if (explicit) return explicit

  const leftover = headerLines
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false
      if (candidate.name && line === candidate.name) return false
      if (candidate.email && line.includes(candidate.email)) return false
      if (candidate.phone && line.includes(candidate.phone)) return false
      if (candidate.links.some((link) => line.includes(link.url))) return false
      return true
    })
    .join(' ')
    .trim()

  return leftover || null
}
