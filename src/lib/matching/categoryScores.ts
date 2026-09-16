import type { MatchStatus } from '@/types/score'

const STATUS_POINTS: Record<MatchStatus, number> = { matched: 100, partial: 50, missing: 0 }

/** Averages a list of matched/partial/missing entries into a 0-100 score. An empty list (nothing required) earns full credit, not a penalty. */
export function scoreEntries(entries: { status: MatchStatus }[]): number {
  if (entries.length === 0) return 100
  const total = entries.reduce((sum, entry) => sum + STATUS_POINTS[entry.status], 0)
  return Math.round(total / entries.length)
}

/** Scores a single matched/partial/missing result that may not have been required at all (e.g. no title/experience/education stated in the JD). */
export function scoreSingleResult(result: { status: MatchStatus; required: boolean }): number {
  return result.required ? STATUS_POINTS[result.status] : 100
}
