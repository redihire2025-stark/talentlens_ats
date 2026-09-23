import { ATS_SCORE_WEIGHTS } from './scoringConfig'
import { ATS_SCORE_CATEGORIES, type AtsScoreWeights } from './types'

/**
 * Combines the 7 raw category scores into one overall Resume Health / ATS
 * Readiness score using the configured weights. Equivalent to
 * `totalWeightedScore` over the `ScoreComponent`s `analyzeAtsCompatibility`
 * builds (each component's `weightedScore` is `rawScore * weight`) — kept
 * as a raw-number entry point for callers that only have the category
 * scores.
 */
export function calculateAtsScore(rawScores: AtsScoreWeights): number {
  const weightedSum = ATS_SCORE_CATEGORIES.reduce(
    (sum, category) => sum + rawScores[category] * ATS_SCORE_WEIGHTS[category],
    0,
  )
  return Math.round(Math.min(100, Math.max(0, weightedSum)))
}
