import type { MatchAnalysis } from '@/lib/matching/types'
import { RECOMMENDATION_IMPACT } from './impactConfig'
import type { RecommendationDraft } from './types'

/**
 * Flags a JD-stated minimum-years-of-experience gap. Reuses
 * `experienceMatcher.ts`'s own `matched`/`partial`/`missing` status and
 * `candidateYears` calculation rather than recomputing years here — this
 * generator only decides whether/how to phrase a recommendation from that
 * already-computed result.
 */
export function experienceGapRecommendations(matchAnalysis: MatchAnalysis): RecommendationDraft[] {
  const { experience } = matchAnalysis
  if (!experience.required || experience.status === 'matched') return []

  const years = experience.candidateYears !== null ? `${experience.candidateYears} years` : 'no dated experience'
  const required = experience.requiredMinimumYears !== null ? `${experience.requiredMinimumYears}+ years` : 'more experience'

  return [
    {
      id: 'experience-gap',
      category: 'experience-gap',
      title: `Experience is below the JD's stated requirement`,
      currentText: null,
      suggestedText: null,
      guidance: `The job description asks for ${required}; your resume shows ${years}. There's no way to close this gap by rewording — only genuine additional experience closes it. Make sure every relevant role and its dates are fully represented, since an undercounted timeline can understate real experience.`,
      impact: RECOMMENDATION_IMPACT['experience-gap'],
      // The dated roles the years figure was computed from.
      evidence: experience.evidence,
    },
  ]
}
