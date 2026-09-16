import { ATS_SCORE_CATEGORIES, type AtsScoreCategory } from '@/lib/ats/types'

/** Display labels for the ATS Compatibility Score's 7 categories — see docs/scoring/scoring-methodology.md. */
export const ATS_CATEGORY_LABELS: Record<AtsScoreCategory, string> = {
  parsing: 'Parsing',
  sections: 'Sections',
  keywords: 'Keywords',
  experience: 'Experience',
  skillsEvidence: 'Skills Evidence',
  formatting: 'Formatting',
  contentQuality: 'Content Quality',
}

/** Shorter labels for the "Resume Health" summary cards. */
export const ATS_HEALTH_CARD_LABELS: Record<AtsScoreCategory, string> = {
  parsing: 'Parsing',
  sections: 'Structure',
  keywords: 'Keywords',
  experience: 'Experience',
  skillsEvidence: 'Skills',
  formatting: 'Formatting',
  contentQuality: 'Content Impact',
}

export type HealthStatus = 'strong' | 'good' | 'needs-improvement'

/** Same thresholds `src/components/shared.tsx`'s ScoreRing/ProgressBar/StatusBadge use, so color and label stay consistent across the UI. */
export function scoreToHealthStatus(score: number): HealthStatus {
  if (score >= 85) return 'strong'
  if (score >= 70) return 'good'
  return 'needs-improvement'
}

/**
 * `analyzeAtsCompatibility` (TASK-008) builds its `explanations` array by
 * iterating `ATS_SCORE_CATEGORIES` in this exact order, so index-matching
 * against that same order is how a category's own explanation is found —
 * not string-matching or re-deriving it.
 */
export function explanationForCategory(explanations: string[], category: AtsScoreCategory): string {
  return explanations[ATS_SCORE_CATEGORIES.indexOf(category)] ?? ''
}
