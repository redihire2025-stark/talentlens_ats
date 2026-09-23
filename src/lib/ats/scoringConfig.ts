import type { AtsScoreWeights } from './types'

/**
 * Internal weights combining the 7 Resume Health / ATS Readiness sub-scores
 * (PRD §11) into one overall score. These are TalentLens product weights,
 * not a claim about how any specific commercial ATS weighs these factors —
 * see docs/scoring/scoring-methodology.md. Configured here, not scattered
 * across the analyzer modules.
 */
export const ATS_SCORE_WEIGHTS: AtsScoreWeights = {
  atsEssentials: 0.2,
  resumeStructure: 0.2,
  contentQuality: 0.15,
  skillsEvidence: 0.2,
  experienceSeniority: 0.1,
  recruiterReadability: 0.1,
  riskConsistency: 0.05,
}
