import type { ScoreBreakdown, ScoreResult } from '@/types/score'

/** One category's before/after delta, e.g. "+5 Required Skill Coverage". */
export interface ScoreChangeEntry {
  category: string
  /** Human-readable label for `category` (from the caller's label map), falling back to the raw key when none is given. */
  label: string
  before: number
  after: number
  /** `after - before`, rounded to a whole point — positive, negative, or zero. */
  delta: number
}

/**
 * Diffs two already-computed score breakdowns (Resume Health's 7 categories
 * or, when a JD is active, Job Match's 8 components) into a per-category
 * change list — spec §48's "a score change without an explanation is not
 * acceptable" requirement. This never recomputes a score; it's a pure diff
 * over two `ScoreResult.breakdown` objects the scoring engine already
 * produced, so it stays consistent with whatever that engine reports and
 * never invents its own notion of what changed.
 *
 * `labels` maps a breakdown key (e.g. `requiredSkills`) to its display name
 * (e.g. "Required Skills") — pass `ATS_CATEGORY_LABELS` or
 * `JD_MATCH_CATEGORY_LABELS` from `src/features/*`. Categories present in
 * only one breakdown are skipped (comparing two different score shapes,
 * e.g. Resume Health vs. Job Match, isn't meaningful).
 */
export function diffScoreBreakdown<T extends ScoreBreakdown>(
  before: T,
  after: T,
  labels: Partial<Record<keyof T, string>> = {},
): ScoreChangeEntry[] {
  const categories = Object.keys(before).filter((key) => key in after) as (keyof T & string)[]

  return categories
    .map((category) => {
      const beforeValue = before[category]
      const afterValue = after[category]
      return {
        category,
        label: labels[category as keyof T] ?? category,
        before: beforeValue,
        after: afterValue,
        delta: Math.round(afterValue - beforeValue),
      }
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
export function explainScoreChange<T extends ScoreBreakdown>(
  before: ScoreResult<T>,
  after: ScoreResult<T>,
  labels: Partial<Record<keyof T, string>> = {},
): { entries: ScoreChangeEntry[]; summary: string; overallDelta: number } {
  const entries = diffScoreBreakdown(before.breakdown, after.breakdown, labels)
  return {
    entries,
    summary: formatScoreChange(entries),
    overallDelta: Math.round(after.score - before.score),
  }
}
