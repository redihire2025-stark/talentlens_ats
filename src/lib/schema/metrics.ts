import type { MetricEvidence } from '@/types/resume'

/**
 * Metric patterns in priority order — an earlier pattern claims its span
 * first, so "35%" is one `percentage`, not also a `count` of 35.
 */
const METRIC_PATTERNS: [kind: MetricEvidence['kind'], pattern: RegExp][] = [
  ['currency', /[$€£]\s?\d[\d,]*(?:\.\d+)?\s?(?:[kmb]\b|million\b|billion\b|thousand\b)?/gi],
  ['percentage', /\d[\d,]*(?:\.\d+)?\s?(?:%|percent\b)/gi],
  ['multiplier', /\b\d+(?:\.\d+)?x\b/gi],
  ['duration', /\b\d[\d,]*(?:\.\d+)?\+?\s?(?:ms|milliseconds?|seconds?|secs?|minutes?|mins?|hours?|hrs?|days?|weeks?|months?|years?|yrs?)\b/gi],
  ['count', /\b\d[\d,]*(?:\.\d+)?\+?/g],
]

/** A bare 4-digit year (1950-2099) in a bullet ("since 2019") is a date, not a metric. */
const YEAR_RE = /^(19[5-9]\d|20\d\d)$/

/**
 * Pulls every number-bearing phrase out of a bullet, verbatim. Purely
 * extractive — it never estimates, scales, or infers a figure that isn't
 * written — so `metrics` on an `ExperienceBullet` is always a subset of
 * what the candidate actually wrote.
 */
export function extractMetrics(text: string): MetricEvidence[] {
  const claimed: [start: number, end: number][] = []
  const found: (MetricEvidence & { index: number })[] = []

  for (const [kind, pattern] of METRIC_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      const raw = match[0].trim()
      const start = match.index!
      const end = start + match[0].length
      if (claimed.some(([s, e]) => start < e && end > s)) continue
      if (kind === 'count' && YEAR_RE.test(raw)) continue
      const numeric = raw.match(/\d[\d,]*(?:\.\d+)?/)
      if (!numeric) continue
      claimed.push([start, end])
      found.push({ text: raw, value: Number(numeric[0].replace(/,/g, '')), kind, index: start })
    }
  }

  return found.sort((a, b) => a.index - b.index).map(({ index: _index, ...metric }) => metric)
}
