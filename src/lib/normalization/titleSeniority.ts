export type SeniorityLevel = 'intern' | 'junior' | 'mid' | 'senior' | 'staff' | 'principal' | 'lead' | 'manager'

const SENIORITY_PREFIX_PATTERNS: [pattern: RegExp, level: SeniorityLevel][] = [
  [/^intern(?:ship)?\b/i, 'intern'],
  [/^(junior|jr\.?)\b/i, 'junior'],
  [/^(senior|sr\.?)\b/i, 'senior'],
  [/^staff\b/i, 'staff'],
  [/^principal\b/i, 'principal'],
  [/^lead\b/i, 'lead'],
  [/^(engineering |team )?manager\b/i, 'manager'],
]

export interface SeniorityStripResult {
  seniority: SeniorityLevel | null
  /** The title text with the recognized seniority prefix removed and re-trimmed. */
  remainder: string
}

/**
 * Strips a recognized seniority prefix ("Senior", "Sr.", "Staff", "Lead", …)
 * from the front of a title so the core role ("Frontend Engineer") can be
 * looked up in `titleSynonyms` independent of level. A title with no
 * recognized prefix is assumed mid-level (seniority: null, not a guess).
 */
export function stripSeniorityPrefix(title: string): SeniorityStripResult {
  const trimmed = title.trim()
  for (const [pattern, level] of SENIORITY_PREFIX_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { seniority: level, remainder: trimmed.replace(pattern, '').trim() }
    }
  }
  return { seniority: null, remainder: trimmed }
}
