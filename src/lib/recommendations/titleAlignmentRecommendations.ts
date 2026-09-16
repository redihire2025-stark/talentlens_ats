import type { MatchAnalysis } from '@/lib/matching/types'
import { RECOMMENDATION_IMPACT } from './impactConfig'
import type { Recommendation } from './types'

/** Suggests reviewing title framing when it doesn't closely match the JD's — never suggests adopting a title the candidate didn't actually hold. */
export function titleAlignmentRecommendations(matchAnalysis: MatchAnalysis): Recommendation[] {
  const { title } = matchAnalysis
  if (!title.required || title.status === 'matched') return []

  return [
    {
      id: 'title-alignment',
      category: 'title-alignment',
      title: 'Your most recent title may not read as a close match',
      currentText: title.resumeTitle,
      guidance: `The job description is titled "${title.jdTitle}". Your most recent title, "${title.resumeTitle ?? 'not found'}", reads differently. If your actual responsibilities align with the role, consider whether your resume clearly explains that overlap — but only use a title you genuinely held.`,
      impact: RECOMMENDATION_IMPACT['title-alignment'],
    },
  ]
}
