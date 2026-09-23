import type { ContactInformation } from '@/types/resume'
import { buildContactInformation } from '@/lib/schema/resumeBuilders'
import { extractEmail, extractLinks, extractLocation, extractName, extractPhone } from './fieldExtractors'

/** Extracts contact fields from the header block; each found field's evidence quotes the header line it came from. */
export function buildContact(headerLines: string[]): ContactInformation {
  const headerText = headerLines.join('\n')
  return buildContactInformation({
    name: extractName(headerLines),
    email: extractEmail(headerText),
    phone: extractPhone(headerText),
    location: extractLocation(headerLines),
    links: extractLinks(headerText),
    headerLines,
  })
}

/**
 * Falls back to the header block for a summary when there's no explicit
 * "Summary" section: any header lines left over once the name, contact
 * info, and links are accounted for are assumed to be a summary paragraph.
 */
export function buildSummary(headerLines: string[], summaryLines: string[], contact: ContactInformation): string | null {
  const explicit = summaryLines.join(' ').trim()
  if (explicit) return explicit

  const leftover = headerLines
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false
      if (contact.name && line === contact.name) return false
      if (contact.email && line.includes(contact.email)) return false
      if (contact.phone && line.includes(contact.phone)) return false
      if (contact.links.some((link) => line.includes(link.url))) return false
      return true
    })
    .join(' ')
    .trim()

  return leftover || null
}
