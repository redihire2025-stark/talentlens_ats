import type { Resume } from '@/types/resume'
import type { MatchAnalysis } from '@/lib/matching/types'

export type RecommendationCategory =
  | 'bullet-impact'
  | 'skill-not-demonstrated'
  | 'skill-evidence'
  | 'missing-section'
  | 'formatting'
  | 'title-alignment'

export interface RecommendationImpact {
  /** Which score category this recommendation would help if acted on truthfully. */
  metric: string
  /** A small positive point estimate, e.g. "+4" — never a promise, just a rough indicator of where effort helps most. */
  delta: number
}

/**
 * A single, evidence-based suggestion. `currentText`, when present, is a
 * verbatim quote from the resume — never altered. `guidance` explains what
 * to consider adding or changing, and it never tells the user to simply
 * insert a skill, metric, or achievement: see docs/product/v1-scope.md's
 * "no fabricated resume content" principle. Turning guidance into actual
 * edited text is the user's call, made in the resume editor (TASK-016).
 */
export interface Recommendation {
  id: string
  category: RecommendationCategory
  title: string
  currentText: string | null
  guidance: string
  impact: RecommendationImpact
}

export interface GenerateRecommendationsInput {
  resume: Resume
  /** The resume parser's warnings (TASK-004) — reused here the same way the ATS engine reuses them. */
  parserWarnings: string[]
  /** Present only when a job description was supplied. */
  matchAnalysis?: MatchAnalysis
}
