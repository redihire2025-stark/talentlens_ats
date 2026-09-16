export const JD_MATCH_SCORE_CATEGORIES = [
  'requiredSkills',
  'preferredSkills',
  'experience',
  'responsibilities',
  'title',
  'education',
  'keywords',
  'atsCompatibility',
] as const

export type JdMatchScoreCategory = (typeof JD_MATCH_SCORE_CATEGORIES)[number]

export type JdMatchScoreBreakdown = Record<JdMatchScoreCategory, number>

/**
 * Product weights for the JD Match Score, straight from AGENTS.md's
 * SCORING section — not a claim about how any specific ATS vendor weighs
 * these factors. Configured here, not scattered across the matchers.
 */
export const JD_MATCH_SCORE_WEIGHTS: JdMatchScoreBreakdown = {
  requiredSkills: 0.25,
  preferredSkills: 0.1,
  experience: 0.15,
  responsibilities: 0.15,
  title: 0.1,
  education: 0.05,
  keywords: 0.1,
  atsCompatibility: 0.1,
}
