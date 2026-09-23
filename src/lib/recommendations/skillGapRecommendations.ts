import type { MatchAnalysis, MatchResult } from '@/lib/matching/types'
import { RECOMMENDATION_IMPACT } from './impactConfig'
import type { RecommendationDraft } from './types'

/**
 * Turns missing/partial required or preferred skills (TASK-009's matching
 * engine) into recommendations. Per AGENTS.md: never imply a missing skill
 * should simply be added — only suggest documenting it if the candidate
 * genuinely has that experience, and make the "if not, don't add it"
 * framing explicit rather than assumed.
 */
export function skillGapRecommendations(matchAnalysis: MatchAnalysis): RecommendationDraft[] {
  const required = matchAnalysis.skills.required.map((entry) => buildEntry(entry, true))
  const preferred = matchAnalysis.skills.preferred.map((entry) => buildEntry(entry, false))
  return [...required, ...preferred].filter((r): r is RecommendationDraft => r !== null)
}

function buildEntry(entry: MatchResult, isRequired: boolean): RecommendationDraft | null {
  if (entry.status === 'matched') return null

  const importance = isRequired ? 'required' : 'preferred'
  const impact = RECOMMENDATION_IMPACT['skill-not-demonstrated']
  const scaledImpact = isRequired ? impact : { ...impact, delta: Math.round(impact.delta / 2) }

  if (entry.status === 'missing') {
    return {
      id: `skill-gap-${entry.requirementId}`,
      category: 'skill-not-demonstrated',
      title: `${entry.normalizedTerm} (${importance}) isn't demonstrated`,
      currentText: null,
      suggestedText: null,
      guidance: `This job description lists "${entry.normalizedTerm}" as ${importance}, but nothing in your resume shows experience with it. If you have genuine, hands-on experience, add a specific example. If you don't, please don't add it — an unsupported skill claim can hurt more than a gap.`,
      impact: scaledImpact,
      evidence: [],
    }
  }

  return {
    id: `skill-gap-${entry.requirementId}`,
    category: 'skill-not-demonstrated',
    title: `${entry.normalizedTerm} (${importance}) is only loosely related`,
    currentText: entry.evidence[0]?.text ?? null,
    suggestedText: null,
    guidance: `Your resume shows something related to "${entry.normalizedTerm}" (${entry.evidence[0]?.text ?? 'a related skill'}), but not an exact match. If you have direct experience with "${entry.normalizedTerm}" specifically, make that explicit.`,
    impact: scaledImpact,
    evidence: entry.evidence,
  }
}
