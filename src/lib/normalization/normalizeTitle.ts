import type { SeniorityLevel } from './titleSeniority'
import { stripSeniorityPrefix } from './titleSeniority'
import { normalizeCoreTitle } from './titleSynonyms'

export interface NormalizedTitle {
  seniority: SeniorityLevel | null
  coreTitle: string
}

/**
 * Full title normalization: strips a recognized seniority prefix, then
 * canonicalizes what's left. "Sr. Frontend Developer" and "Senior
 * Front-End Engineer" both normalize to
 * `{ seniority: 'senior', coreTitle: 'frontend engineer' }`.
 */
export function normalizeTitle(input: string): NormalizedTitle {
  const { seniority, remainder } = stripSeniorityPrefix(input)
  return { seniority, coreTitle: normalizeCoreTitle(remainder) }
}
