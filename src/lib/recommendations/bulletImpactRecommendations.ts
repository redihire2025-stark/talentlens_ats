import type { Resume } from '@/types/resume'
import { buildDeterministicBulletSuggestion, isQuantified, startsWithActionVerb } from '@/lib/ats/bulletQuality'
import { RECOMMENDATION_IMPACT } from './impactConfig'
import type { RecommendationDraft } from './types'

/**
 * Flags bullets that read as vague duty statements rather than concrete
 * accomplishments — the same signal contentQualityAnalyzer.ts scores
 * (TASK-008), turned into per-bullet guidance. Mirrors the product brief's
 * own example: "Built React applications." → "Add measurable scope,
 * impact, architecture, performance, or responsibility details if they
 * are truthful." Never proposes replacement wording with invented
 * specifics — that would be fabrication.
 */
export function bulletImpactRecommendations(resume: Resume): RecommendationDraft[] {
  const recommendations: RecommendationDraft[] = []

  resume.experience.forEach((entry, entryIndex) => {
    entry.bullets.forEach((bullet, bulletIndex) => {
      if (startsWithActionVerb(bullet) && isQuantified(bullet)) return

      const missing: string[] = []
      if (!startsWithActionVerb(bullet)) missing.push('a strong action verb')
      if (!isQuantified(bullet)) missing.push('a measurable scope, impact, or metric')

      recommendations.push({
        id: `bullet-impact-${entryIndex}-${bulletIndex}`,
        category: 'bullet-impact',
        title: `Strengthen a bullet under ${entry.company || entry.title || 'this role'}`,
        currentText: bullet,
        // Always a real, usable bullet — never null — so the UI never falls
        // back to generic guidance text in place of a concrete suggestion.
        suggestedText: buildDeterministicBulletSuggestion(bullet),
        guidance: `Consider adding ${missing.join(' and ')} — if they are truthful. Don't invent numbers or outcomes that didn't happen.`,
        impact: RECOMMENDATION_IMPACT['bullet-impact'],
        location: { section: 'experience', entryIndex, bulletIndex },
      })
    })
  })

  return recommendations
}
