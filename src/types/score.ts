import type { Evidence } from './evidence'

/**
 * Whether a requirement (a JD skill, an ATS check) was demonstrated by the
 * resume. "partial" covers related-but-not-full evidence — see
 * docs/scoring/matching-rules.md for how the matching engine decides this.
 */
export type MatchStatus = 'matched' | 'partial' | 'missing'

/**
 * One category's contribution to an overall score (spec §53). The overall
 * score is `round(sum of weightedScore)` — nothing else — so every point
 * of it is traceable to a component, its weight, and its explanation.
 */
export interface ScoreComponent<TCategory extends string = string> {
  category: TCategory
  /** The category's own 0-100 score, before weighting. This is what the dashboards show as the category percentage. */
  rawScore: number
  /** 0-1, from the scoring config. All weights in one breakdown sum to 1. */
  weight: number
  /** `rawScore * weight` — the category's contribution, in points, to the overall score. Unrounded; round only for display. */
  weightedScore: number
  explanation: string
  evidence: Evidence[]
}

/** Every category's component, in the scoring config's fixed category order. */
export type ScoreBreakdown<TCategory extends string = string> = ScoreComponent<TCategory>[]

/**
 * Shared response shape for both the Resume Health / ATS Readiness score and the Job
 * Match Score (see docs/scoring/scoring-methodology.md). Every score is
 * returned with its breakdown and explanations — never a bare number — so
 * the UI never has to present a mysterious figure.
 */
export interface ScoreResult<TCategory extends string = string> {
  score: number
  breakdown: ScoreBreakdown<TCategory>
  matched: string[]
  missing: string[]
  partial: string[]
  /** One per breakdown component, same order — `breakdown[i].explanation === explanations[i]`. */
  explanations: string[]
}
