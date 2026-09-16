import type { AtsScoreBreakdown } from './types'

/**
 * Internal weights combining the 7 ATS sub-scores into one ATS
 * Compatibility Score. These are TalentLens product weights, not a claim
 * about how any specific commercial ATS weighs these factors — see
 * docs/scoring/scoring-methodology.md. Configured here, not scattered
 * across the analyzer modules.
 */
export const ATS_SCORE_WEIGHTS: AtsScoreBreakdown = {
  parsing: 0.2,
  sections: 0.2,
  keywords: 0.15,
  experience: 0.15,
  skillsEvidence: 0.1,
  formatting: 0.1,
  contentQuality: 0.1,
}
