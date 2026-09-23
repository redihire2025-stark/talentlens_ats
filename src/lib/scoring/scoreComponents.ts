import type { Evidence } from '@/types/evidence'
import type { ScoreBreakdown, ScoreComponent } from '@/types/score'

export function buildScoreComponent<TCategory extends string>(
  category: TCategory,
  rawScore: number,
  weight: number,
  explanation: string,
  evidence: Evidence[] = [],
): ScoreComponent<TCategory> {
  return { category, rawScore, weight, weightedScore: rawScore * weight, explanation, evidence }
}

/** The overall score: the sum of every component's `weightedScore`, clamped to 0-100 and rounded — nothing hidden outside the breakdown. */
export function totalWeightedScore(breakdown: ScoreBreakdown): number {
  const sum = breakdown.reduce((total, component) => total + component.weightedScore, 0)
  return Math.round(Math.min(100, Math.max(0, sum)))
}

export function getScoreComponent<TCategory extends string>(
  breakdown: ScoreBreakdown<TCategory>,
  category: TCategory,
): ScoreComponent<TCategory> | undefined {
  return breakdown.find((component) => component.category === category)
}

/** `{ category: rawScore }` — a keyed view for callers that just need the numbers (tests, compact displays). */
export function rawScoresByCategory<TCategory extends string>(breakdown: ScoreBreakdown<TCategory>): Record<TCategory, number> {
  return Object.fromEntries(breakdown.map((component) => [component.category, component.rawScore])) as Record<TCategory, number>
}

/** "12.8 of 15 pts" — a component's contribution to the overall score, next to the most it could contribute. For display only. */
export function formatContribution(component: Pick<ScoreComponent, 'weightedScore' | 'weight'>): string {
  return `${component.weightedScore.toFixed(1)} of ${Math.round(component.weight * 100)} pts`
}
