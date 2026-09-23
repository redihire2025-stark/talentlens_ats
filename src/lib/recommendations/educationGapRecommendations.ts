import type { MatchAnalysis } from '@/lib/matching/types'
import { RECOMMENDATION_IMPACT } from './impactConfig'
import type { RecommendationDraft } from './types'

/**
 * Turns each JD education requirement `educationMatcher.ts` didn't fully
 * satisfy (every per-requirement result that's `partial` or `missing`)
 * into a recommendation, reusing the matcher's own reason. Never suggests claiming a degree
 * the candidate doesn't hold.
 */
export function educationGapRecommendations(matchAnalysis: MatchAnalysis): RecommendationDraft[] {
  const { education } = matchAnalysis
  if (!education.required || education.status === 'matched') return []

  return education.requirements
    .filter((match) => match.status !== 'matched')
    .map((match) => ({
      id: `education-gap-${match.requirementId}`,
      category: 'education-gap' as const,
      title: `Education requirement not fully evidenced: ${match.requirement}`,
      currentText: null,
      suggestedText: null,
      guidance: `The job description asks for "${match.requirement}". ${match.reason} If you hold a relevant degree or equivalent experience, make sure your education section states it clearly — never claim a credential you don't have.`,
      impact: RECOMMENDATION_IMPACT['education-gap'],
      // What the resume *does* show for this requirement (a degree in another field, or work experience), when anything.
      evidence: match.evidence,
    }))
}
