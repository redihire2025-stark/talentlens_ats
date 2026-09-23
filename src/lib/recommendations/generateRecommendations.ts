import { bulletImpactRecommendations } from './bulletImpactRecommendations'
import { missingSectionRecommendations } from './missingSectionRecommendations'
import { skillEvidenceRecommendations } from './skillEvidenceRecommendations'
import { formattingRecommendations } from './formattingRecommendations'
import { skillGapRecommendations } from './skillGapRecommendations'
import { titleAlignmentRecommendations } from './titleAlignmentRecommendations'
import type { GenerateRecommendationsInput, Recommendation, RecommendationDraft, RecommendationSeverity } from './types'

/** Impact deltas of 5+ are "high" (a required-skill gap, a missing section); 3-4 "medium"; anything smaller "low". Product judgment, not a scientific scale — see `impactConfig.ts`. */
function severityFromDelta(delta: number): RecommendationSeverity {
  if (delta >= 5) return 'high'
  if (delta >= 3) return 'medium'
  return 'low'
}

/**
 * Fills in the target architecture PRD §15 fields from what each generator
 * already computed, in exactly one place (see `RecommendationDraft`'s
 * doc comment). Every field here is derived, never guessed: `confidence`
 * is always 1 because a deterministic generator is reporting what it
 * found in the resume/JD, not estimating a probability.
 */
export function toPrdRecommendationFields(draft: RecommendationDraft): Recommendation {
  return {
    ...draft,
    severity: severityFromDelta(draft.impact.delta),
    issue: draft.title,
    evidence: draft.currentText ? [draft.currentText] : [],
    explanation: draft.guidance,
    suggestedChange: draft.suggestedText,
    confidence: 1,
    source: 'deterministic',
    requiresUserInput: draft.suggestedText === null,
    status: 'pending',
  }
}

/**
 * Runs every recommendation generator and returns the combined list.
 * Resume-only generators always run; JD-dependent ones (skill gaps, title
 * alignment) only run when a job description was analyzed. Every
 * recommendation traces back to real resume/JD content — none is
 * generated from a fabricated fact (see docs/product/v1-scope.md).
 */
export function generateRecommendations({ resume, parserWarnings, matchAnalysis }: GenerateRecommendationsInput): Recommendation[] {
  const drafts: RecommendationDraft[] = [
    ...bulletImpactRecommendations(resume),
    ...missingSectionRecommendations({ resume, parserWarnings }),
    ...skillEvidenceRecommendations(resume),
    ...formattingRecommendations(resume),
  ]

  if (matchAnalysis) {
    drafts.push(...skillGapRecommendations(matchAnalysis), ...titleAlignmentRecommendations(matchAnalysis))
  }

  return drafts.map(toPrdRecommendationFields)
}
