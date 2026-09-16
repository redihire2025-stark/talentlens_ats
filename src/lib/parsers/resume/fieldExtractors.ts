import type { CandidateLink, CandidateLinkType } from '@/types/resume'
import type { Nullable } from '@/types/common'

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
const PHONE_RE = /(\(?\+?\d[\d .()-]{6,}\d\)?)/
const URL_RE = /\bhttps?:\/\/[^\s,;)]+/gi
/**
 * Deliberately requires a 2-letter code (a US state, or similar) after the
 * comma rather than any capitalized word — an earlier, looser version of
 * this pattern could match things like "Software Engineer, Beta" as a
 * false "location" inside an experience meta line. Missing a spelled-out
 * state/country ("Austin, Texas") is an acceptable trade-off for not
 * corrupting title/company parsing.
 */
const LOCATION_RE = /\b([A-Z][a-zA-Z.]+(?:\s+[A-Z][a-zA-Z.]+){0,2}),\s*([A-Z]{2})\b/

export function extractEmail(text: string): Nullable<string> {
  return text.match(EMAIL_RE)?.[0] ?? null
}

export function extractPhone(text: string): Nullable<string> {
  const match = text.match(PHONE_RE)?.[0]?.trim()
  return match ?? null
}

function classifyLink(url: string): CandidateLinkType {
  const host = url.toLowerCase()
  if (host.includes('linkedin.com')) return 'linkedin'
  if (host.includes('github.com')) return 'github'
  if (host.includes('portfolio') || host.includes('behance.net') || host.includes('dribbble.com')) return 'portfolio'
  return 'website'
}

export function extractLinks(text: string): CandidateLink[] {
  const matches = [...text.matchAll(URL_RE)].map((match) => match[0].replace(/[.,]+$/, ''))
  const unique = [...new Set(matches)]
  return unique.map((url) => ({ type: classifyLink(url), url }))
}

/**
 * Best-effort candidate name: the first line before any recognized section
 * header that isn't itself an email, phone number, or link. Resumes
 * overwhelmingly lead with the candidate's name, so this is a reasonable
 * deterministic guess — never a fabricated fallback name.
 */
export function extractName(headerLines: string[]): Nullable<string> {
  for (const rawLine of headerLines) {
    const line = rawLine.trim()
    if (!line) continue
    if (EMAIL_RE.test(line) || PHONE_RE.test(line) || URL_RE.test(line)) continue
    if (line.length > 60) continue
    return line
  }
  return null
}

export function extractLocation(headerLines: string[]): Nullable<string> {
  for (const line of headerLines) {
    if (/\bremote\b/i.test(line)) return 'Remote'
    const match = line.match(LOCATION_RE)
    if (match) return match[0]
  }
  return null
}
