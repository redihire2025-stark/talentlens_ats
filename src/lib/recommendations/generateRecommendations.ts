import { bulletImpactRecommendations } from './bulletImpactRecommendations'
import { missingSectionRecommendations } from './missingSectionRecommendations'
import { skillEvidenceRecommendations } from './skillEvidenceRecommendations'
import { formattingRecommendations } from './formattingRecommendations'
import { skillGapRecommendations } from './skillGapRecommendations'
import { titleAlignmentRecommendations } from './titleAlignmentRecommendations'
import { hardRequirementRecommendations } from './hardRequirementRecommendations'
import { experienceGapRecommendations } from './experienceGapRecommendations'
import { responsibilityGapRecommendations } from './responsibilityGapRecommendations'
import { educationGapRecommendations } from './educationGapRecommendations'
import type { GenerateRecommendationsInput, Recommendation, RecommendationDraft, RecommendationSeverity } from './types'
import { explicitEvidence } from '@/lib/schema/evidence'

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
  const { evidence, ...fields } = draft
  return {
    ...fields,
    severity: severityFromDelta(draft.impact.delta),
    issue: draft.title,
    // Generators that know where their text came from supply typed evidence;
    // otherwise a quoted `currentText` is the evidence (its section unknown).
    evidence: evidence ?? (draft.currentText ? [explicitEvidence(draft.currentText, 'other')] : []),
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
    drafts.push(
      ...skillGapRecommendations(matchAnalysis),
      ...titleAlignmentRecommendations(matchAnalysis),
      ...hardRequirementRecommendations(matchAnalysis),
      ...experienceGapRecommendations(matchAnalysis),
      ...responsibilityGapRecommendations(matchAnalysis),
      ...educationGapRecommendations(matchAnalysis),
    )
  }

  return drafts.map(toPrdRecommendationFields)
}
