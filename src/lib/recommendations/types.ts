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

/** Precisely where in the Resume a recommendation's `currentText` lives, so the editor (TASK-016) can apply a user-edited replacement without guessing. Only bullet-impact recommendations have one. */
export interface RecommendationLocation {
  section: 'experience'
  entryIndex: number
  bulletIndex: number
}

/**
 * A single, evidence-based suggestion. `currentText`, when present, is a
 * verbatim quote from the resume — never altered. `guidance` explains what
 * to consider adding or changing, and it never tells the user to simply
 * insert a skill, metric, or achievement: see docs/product/v1-scope.md's
 * "no fabricated resume content" principle.
 *
 * `suggestedText`, when present, is a ready-to-apply replacement for
 * `currentText` built only from words already in the resume (e.g.
 * stripping a weak lead-in like "Responsible for managing..." down to
 * "Managed...") — accepting the recommendation applies it directly. It's
 * null whenever no safe, non-fabricating rewrite exists (most notably: a
 * missing metric, since no rewrite can invent one), in which case turning
 * guidance into edited text is the user's call, made in the resume editor
 * (TASK-016).
 */
export interface Recommendation {
  id: string
  category: RecommendationCategory
  title: string
  currentText: string | null
  suggestedText: string | null
  guidance: string
  impact: RecommendationImpact
  location?: RecommendationLocation
}

export interface GenerateRecommendationsInput {
  resume: Resume
  /** The resume parser's warnings (TASK-004) — reused here the same way the ATS engine reuses them. */
  parserWarnings: string[]
  /** Present only when a job description was supplied. */
  matchAnalysis?: MatchAnalysis
}
