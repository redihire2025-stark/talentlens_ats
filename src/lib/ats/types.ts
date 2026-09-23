import type { Resume } from '@/types/resume'

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

export type AtsScoreBreakdown = Record<AtsScoreCategory, number>

/** One analyzer's contribution: its 0-100 sub-score plus what it found, in plain language. */
export interface AnalyzerResult {
  score: number
  /** Things that look good — surfaced as `matched` in the final ScoreResult. */
  strengths: string[]
  /** Things that are missing or risky — surfaced as `missing`. */
  issues: string[]
  /** One or two human-readable sentences explaining the score. */
  explanation: string
}
