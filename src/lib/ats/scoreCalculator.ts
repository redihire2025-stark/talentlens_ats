import { ATS_SCORE_WEIGHTS } from './scoringConfig'
import { ATS_SCORE_CATEGORIES, type AtsScoreBreakdown } from './types'

/** Combines the 7 sub-scores into one overall Resume Health / ATS Readiness score using the configured weights. */
export function calculateAtsScore(breakdown: AtsScoreBreakdown): number {
  const weightedSum = ATS_SCORE_CATEGORIES.reduce(
    (sum, category) => sum + breakdown[category] * ATS_SCORE_WEIGHTS[category],
    0,
  )
  return Math.round(Math.min(100, Math.max(0, weightedSum)))
}
