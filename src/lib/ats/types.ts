import type { Resume } from '@/types/resume'
import type { Evidence } from '@/types/evidence'
import type { ScoreBreakdown } from '@/types/score'

/**
 * What the ATS engine analyzes: the parsed Resume plus whatever warnings
 * the parser (TASK-004) already produced while extracting it. Reusing the
 * parser's own warnings (e.g. "no text could be extracted") avoids
 * re-deriving parse-quality signals the parser already computed.
 */
export interface AtsAnalysisInput {
  resume: Resume
  parserWarnings: string[]
}

/**
 * The seven Resume Health / ATS Readiness categories (PRD §11 —
 * docs/product/target-architecture-prd.md). This mirrors, rather than
 * duplicates, the original 7 analyzers: `keywords` (keyword-richness) is
 * folded into `skillsEvidence` since both measure skill signal quality, and
 * `riskConsistency` is new (date conflicts, overlapping employment,
 * duplicate entries, malformed links — all computable from the parsed
 * Resume JSON with no new infrastructure). See
 * docs/scoring/scoring-methodology.md for what each category measures.
 */
export const ATS_SCORE_CATEGORIES = [
  'atsEssentials',
  'resumeStructure',
  'contentQuality',
  'skillsEvidence',
  'experienceSeniority',
  'recruiterReadability',
  'riskConsistency',
] as const

export type AtsScoreCategory = (typeof ATS_SCORE_CATEGORIES)[number]

/** The 7 Resume Health `ScoreComponent`s, in `ATS_SCORE_CATEGORIES` order. */
export type AtsScoreBreakdown = ScoreBreakdown<AtsScoreCategory>

/** Per-category weights (or any other per-category number). */
export type AtsScoreWeights = Record<AtsScoreCategory, number>

/** One analyzer's contribution: its 0-100 sub-score plus what it found, in plain language. */
export interface AnalyzerResult {
  score: number
  /** Things that look good — surfaced as `matched` in the final ScoreResult. */
  strengths: string[]
  /** Things that are missing or risky — surfaced as `missing`. */
  issues: string[]
  /** One or two human-readable sentences explaining the score. */
  explanation: string
  /** Resume text (or, where no literal quote exists, a structural observation) behind the score. Becomes the category's `ScoreComponent.evidence`. */
  evidence?: Evidence[]
}
