import type { MatchAnalysis } from '@/lib/matching/types'
import { RECOMMENDATION_IMPACT } from './impactConfig'
import type { RecommendationDraft } from './types'

/**
 * Turns each JD education requirement `educationMatcher.ts` didn't fully
 * satisfy (`missingRequirements`, which already includes both `partial` and
 * `missing` lines) into a recommendation. Never suggests claiming a degree
 * the candidate doesn't hold.
 */
export function educationGapRecommendations(matchAnalysis: MatchAnalysis): RecommendationDraft[] {
  const { education } = matchAnalysis
  if (!education.required || education.status === 'matched') return []

  return education.missingRequirements.map((requirement) => ({
    id: `education-gap-${requirement}`,
    category: 'education-gap' as const,
    title: `Education requirement not fully evidenced: ${requirement}`,
    currentText: null,
    suggestedText: null,
    guidance: `The job description asks for "${requirement}". Your resume doesn't clearly show this is met. If you hold a relevant degree or equivalent experience, make sure your education section states it clearly — never claim a credential you don't have.`,
    impact: RECOMMENDATION_IMPACT['education-gap'],
  }))
}
