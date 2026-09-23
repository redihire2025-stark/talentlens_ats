import type { Resume } from '@/types/resume'
import type { MatchAnalysis } from '@/lib/matching/types'
import type { Evidence } from '@/types/evidence'

export type RecommendationCategory =
  | 'bullet-impact'
  | 'skill-not-demonstrated'
  | 'skill-evidence'
  | 'missing-section'
  | 'formatting'
  | 'title-alignment'
  /** A failed `HardRequirement` (spec §38) — see `hardRequirementRecommendations.ts`. */
  | 'hard-requirement-gap'
  /** The JD wants more years of experience than the resume demonstrates — see `experienceGapRecommendations.ts`. */
  | 'experience-gap'
  /** A JD responsibility line with no matched/partial evidence in the resume — see `responsibilityGapRecommendations.ts`. */
  | 'responsibility-gap'
  /** A JD education requirement not satisfied — see `educationGapRecommendations.ts`. */
  | 'education-gap'

export interface RecommendationImpact {
  /** Which score category this recommendation would help if acted on truthfully. */
  metric: string
  /** A small positive point estimate, e.g. "+4" — never a promise, just a rough indicator of where effort helps most. */
  delta: number
}

/**
 * Precisely where in the Resume a recommendation's `currentText` lives, so
 * the editor (TASK-016) can apply a user-edited replacement without
 * guessing. Only bullet-impact recommendations have one. Carries both the
 * positional indexes (what the editor's array updates use) and the stable
 * `ExperienceEntry.id`/`ExperienceBullet.id` they point at.
 */
export interface RecommendationLocation {
  section: 'experience'
  entryIndex: number
  bulletIndex: number
  entryId: string
  bulletId: string
}

/** How severe an issue is, derived from its configured impact (see `impactConfig.ts`) — used for sorting/highlighting, never for hiding a recommendation. */
export type RecommendationSeverity = 'high' | 'medium' | 'low'

/**
 * Where a recommendation's content came from (PRD §14/§15). `deterministic`
 * is every generator in this folder — pure functions over the parsed
 * Resume/MatchAnalysis, no network call, always reproducible. `ai-suggestion`
 * is a drafted rewrite from the AI bullet-rewrite feature (`src/lib/ai/`):
 * it never determines score, category, or whether an issue exists — it only
 * ever fills in `suggestedChange` text for a recommendation a deterministic
 * generator already raised, and is always clearly labeled as such in the UI
 * (`src/components/Recommendations.tsx`'s "AI-drafted, unverified" badge)
 * and left for the user to accept, edit, or reject.
 */
export type RecommendationSource = 'deterministic' | 'ai-suggestion'

export type RecommendationStatus = 'pending' | 'accepted' | 'rejected' | 'edited'

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
 * (TASK-016) or via an AI-drafted suggestion (`source: 'ai-suggestion'`).
 *
 * The fields below `location` mirror the target architecture PRD §15's
 * Recommendation shape one-for-one; they're computed from the fields above
 * (see `toPrdRecommendationFields` in `generateRecommendations.ts`) rather
 * than duplicated by every generator, so there's exactly one place that
 * decides e.g. what counts as "high severity".
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
  severity: RecommendationSeverity
  /** PRD §15 `issue` — alias of `title`, kept separate so the two can diverge later without a breaking rename. */
  issue: string
  /** PRD §15 `evidence` — typed pointers to the resume text this recommendation is based on (empty when it's about something the resume *lacks*). */
  evidence: Evidence[]
  /** PRD §15 `explanation` — alias of `guidance`. */
  explanation: string
  /** PRD §15 `suggestedChange` — alias of `suggestedText`. */
  suggestedChange: string | null
  /** 1 for every deterministic generator: it's reporting exactly what it found, never a probabilistic guess. An AI-drafted suggestedChange does not raise this — it stays a human-reviewed draft, not a more "confident" fact. */
  confidence: number
  source: RecommendationSource
  /** True when there's nothing safe to auto-apply (`suggestedText`/`suggestedChange` is null) — the user must supply real content (or explicitly decide not to) before this can be accepted as a text change. */
  requiresUserInput: boolean
  /** Initial value is always `pending`; the resume editor (`src/stores/editorStore.ts`) tracks the live, user-driven value per recommendation id. */
  status: RecommendationStatus
}

/**
 * What each individual generator (`bulletImpactRecommendations.ts` etc.)
 * builds — the original, hand-written fields only. `generateRecommendations`
 * enriches every draft into a full `Recommendation` via
 * `toPrdRecommendationFields`, so "what counts as high severity" or
 * "requires user input" is decided in exactly one place, not duplicated
 * across six generator files.
 */
export type RecommendationDraft = Omit<
  Recommendation,
  'severity' | 'issue' | 'evidence' | 'explanation' | 'suggestedChange' | 'confidence' | 'source' | 'requiresUserInput' | 'status'
> & {
  /** Typed evidence, when the generator knows exactly where its `currentText` (or supporting text) came from. Omitted → derived from `currentText` by `toPrdRecommendationFields`. */
  evidence?: Evidence[]
}

export interface GenerateRecommendationsInput {
  resume: Resume
  /** The resume parser's warnings (TASK-004) — reused here the same way the ATS engine reuses them. */
  parserWarnings: string[]
  /** Present only when a job description was supplied. */
  matchAnalysis?: MatchAnalysis
}
