import type { ScoreBreakdown, ScoreResult } from '@/types/score'

/** One category's before/after delta, e.g. "+5 Required Skill Coverage". */
export interface ScoreChangeEntry<TCategory extends string = string> {
  category: TCategory
  /** Human-readable label for `category` (from the caller's label map), falling back to the raw key when none is given. */
  label: string
  /** The category's `rawScore` (0-100) before and after. */
  before: number
  after: number
  /** `after - before` in the category's own 0-100 score, rounded to a whole point — positive, negative, or zero. */
  delta: number
  /** The category's weight (from the *after* breakdown). */
  weight: number
  /** How many points of the *overall* score this category's change accounts for (`after.weightedScore - before.weightedScore`), to two decimals. */
  weightedDelta: number
}

/**
 * Diffs two already-computed `ScoreComponent[]` breakdowns (Resume
 * Health's 7 categories or, when a JD is active, Job Match's 8 components)
 * into a per-category change list — spec §48's "a score change without an
 * explanation is not acceptable" requirement. This never recomputes a
 * score; it's a pure diff over two breakdowns the scoring engine already
 * produced, so it stays consistent with whatever that engine reports and
 * never invents its own notion of what changed. Each entry reports both
 * the category's own movement (`delta`) and its effect on the overall
 * score (`weightedDelta`).
 *
 * `labels` maps a category key (e.g. `requiredSkills`) to its display name
 * (e.g. "Required Skills") — pass `ATS_CATEGORY_LABELS` or
 * `JD_MATCH_CATEGORY_LABELS` from `src/features/*`. Categories present in
 * only one breakdown are skipped (comparing two different score shapes,
 * e.g. Resume Health vs. Job Match, isn't meaningful). Sorted by the
 * largest category change first; ties keep breakdown order.
 */
export function diffScoreBreakdown<TCategory extends string>(
  before: ScoreBreakdown<TCategory>,
  after: ScoreBreakdown<TCategory>,
  labels: Partial<Record<TCategory, string>> = {},
): ScoreChangeEntry<TCategory>[] {
  const afterByCategory = new Map(after.map((component) => [component.category, component]))

  return before
    .flatMap((beforeComponent) => {
      const afterComponent = afterByCategory.get(beforeComponent.category)
      if (!afterComponent) return []
      return [
        {
          category: beforeComponent.category,
          label: labels[beforeComponent.category] ?? beforeComponent.category,
          before: beforeComponent.rawScore,
          after: afterComponent.rawScore,
          delta: Math.round(afterComponent.rawScore - beforeComponent.rawScore),
          weight: afterComponent.weight,
          // `|| 0` normalizes -0 (a tiny negative that rounds away) to 0.
          weightedDelta: Math.round((afterComponent.weightedScore - beforeComponent.weightedScore) * 100) / 100 || 0,
        },
      ]
    })
    .filter((entry) => entry.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
}

/** Formats a `ScoreChangeEntry` list into the spec's example phrasing: "+5 Required Skill Coverage, +2 Responsibility Alignment, -1 Risk/Consistency". */
export function formatScoreChange(entries: ScoreChangeEntry[]): string {
  if (entries.length === 0) return 'No change in any score component.'
  return entries.map((entry) => `${entry.delta > 0 ? '+' : ''}${entry.delta} ${entry.label}`).join(', ')
}

/**
 * Convenience wrapper over `diffScoreBreakdown` + `formatScoreChange` for
 * two full `ScoreResult`s (what `useEditorStore`'s `liveAtsResult`/
 * `liveJdMatchResult` and `useVersionsStore`'s saved snapshots already are).
 */
export function explainScoreChange<TCategory extends string>(
  before: ScoreResult<TCategory>,
  after: ScoreResult<TCategory>,
  labels: Partial<Record<TCategory, string>> = {},
): { entries: ScoreChangeEntry<TCategory>[]; summary: string; overallDelta: number } {
  const entries = diffScoreBreakdown(before.breakdown, after.breakdown, labels)
  return {
    entries,
    summary: formatScoreChange(entries),
    overallDelta: Math.round(after.score - before.score),
  }
}
