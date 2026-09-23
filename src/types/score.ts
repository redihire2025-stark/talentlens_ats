/**
 * Whether a requirement (a JD skill, an ATS check) was demonstrated by the
 * resume. "partial" covers related-but-not-full evidence — see
 * docs/scoring/matching-rules.md for how the matching engine decides this.
 */
export type MatchStatus = 'matched' | 'partial' | 'missing'

/** Named sub-scores that combine, via configured weights, into a ScoreResult's overall score. */
export type ScoreBreakdown = Record<string, number>

/**
 * Shared response shape for both the Resume Health / ATS Readiness score and the Job
 * Match Score (see docs/scoring/scoring-methodology.md). Every score is
 * returned with its breakdown and explanations — never a bare number — so
 * the UI never has to present a mysterious figure.
 */
export interface ScoreResult<TBreakdown extends ScoreBreakdown = ScoreBreakdown> {
  score: number
  breakdown: TBreakdown
  matched: string[]
  missing: string[]
  partial: string[]
  explanations: string[]
}
