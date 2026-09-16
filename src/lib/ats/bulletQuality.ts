export const ACTION_VERBS = [
  'built', 'led', 'developed', 'designed', 'implemented', 'launched', 'improved', 'increased', 'reduced',
  'managed', 'created', 'optimized', 'architected', 'delivered', 'drove', 'established', 'automated',
  'streamlined', 'mentored', 'coordinated', 'analyzed', 'migrated', 'scaled', 'shipped',
]
const QUANTIFICATION_RE = /\d/

/** Shared by contentQualityAnalyzer.ts and the recommendation engine (TASK-011) so both judge bullets the same way. */
export function startsWithActionVerb(bullet: string): boolean {
  const firstWord = bullet.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '')
  return Boolean(firstWord && ACTION_VERBS.includes(firstWord))
}

export function isQuantified(bullet: string): boolean {
  return QUANTIFICATION_RE.test(bullet)
}
