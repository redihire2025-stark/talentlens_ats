import type { MatchAnalysis } from '@/lib/matching/types'
import { RECOMMENDATION_IMPACT } from './impactConfig'
import type { RecommendationDraft } from './types'

/**
 * Turns each JD responsibility line with no matched/partial evidence
 * (`responsibilityMatcher.ts`'s own token-overlap result) into a
 * recommendation. Never suggests inventing a responsibility the candidate
 * didn't perform — only that, if they genuinely did this work, it isn't
 * evidenced clearly in a bullet yet.
 */
export function responsibilityGapRecommendations(matchAnalysis: MatchAnalysis): RecommendationDraft[] {
  return matchAnalysis.responsibilities
    .filter((r) => r.status === 'missing')
    .map((r) => ({
      id: `responsibility-gap-${r.responsibility}`,
      category: 'responsibility-gap' as const,
      title: `"${r.responsibility}" isn't clearly evidenced`,
      currentText: null,
      suggestedText: null,
      guidance: `The job description lists "${r.responsibility}" as a responsibility, but no resume bullet shows clear evidence of it. If you genuinely did this work, add or rewrite a bullet that describes it specifically. If you didn't, leave it out — don't add a bullet just to match this line.`,
      impact: RECOMMENDATION_IMPACT['responsibility-gap'],
    }))
}
