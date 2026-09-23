import type { Resume } from '@/types/resume'
import { RECOMMENDATION_IMPACT } from './impactConfig'
import type { RecommendationDraft } from './types'

/** Flags experience entries with no bullet points — a structural, not content, suggestion. */
export function formattingRecommendations(resume: Resume): RecommendationDraft[] {
  return resume.experience
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.bullets.length === 0)
    .map(({ entry, index }) => ({
      id: `formatting-${index}`,
      category: 'formatting' as const,
      title: `Use bullet points for ${entry.company || entry.title || 'this role'}`,
      currentText: null,
      suggestedText: null,
      guidance: 'Break this role’s description into 2-4 concise bullet points. ATS systems and recruiters scan bulleted accomplishments far more reliably than paragraph text.',
      impact: RECOMMENDATION_IMPACT.formatting,
    }))
}
