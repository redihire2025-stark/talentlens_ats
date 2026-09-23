import type { MatchAnalysis } from '@/lib/matching/types'
import { RECOMMENDATION_IMPACT } from './impactConfig'
import type { RecommendationDraft } from './types'

/**
 * Turns each unsatisfied `HardRequirement` (spec §38/§29) into a
 * recommendation. Deliberately never suggests fabricating the missing
 * requirement — for a required skill this mirrors `skillGapRecommendations`'
 * "only add it if you genuinely have it" framing; for a minimum-experience
 * gap there's nothing to suggest adding at all, since experience can't be
 * invented, so the guidance only reframes what's already there.
 */
export function hardRequirementRecommendations(matchAnalysis: MatchAnalysis): RecommendationDraft[] {
  return matchAnalysis.hardRequirements
    .filter((req) => !req.satisfied)
    .map((req) => ({
      id: `hard-requirement-gap-${req.id}`,
      category: 'hard-requirement-gap' as const,
      title: `Hard requirement not met: ${req.requirementText}`,
      currentText: req.evidence[0] ?? null,
      suggestedText: null,
      guidance:
        req.type === 'required-skill'
          ? `This is listed as a required (hard) requirement, and nothing in your resume demonstrates it. ${req.reason} If you have genuine, hands-on experience, document it specifically. If you don't, please don't add it.`
          : `This is a hard requirement of the role. ${req.reason} This can't be resolved by rewording — only by genuine, documented experience.`,
      impact: RECOMMENDATION_IMPACT['hard-requirement-gap'],
    }))
}
