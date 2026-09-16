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

const WEAK_LEAD_IN_RE =
  /^(responsible for|in charge of|duties included|worked on|helped with|assisted in|assisted with|involved in|tasked with)\s+/i

// Maps a gerund to the past-tense form already in ACTION_VERBS, so a lead-in
// rewrite only ever reuses a verb that's already on the approved list.
const GERUND_TO_ACTION_VERB: Record<string, string> = {
  building: 'built', leading: 'led', developing: 'developed', designing: 'designed',
  implementing: 'implemented', launching: 'launched', improving: 'improved', increasing: 'increased',
  reducing: 'reduced', managing: 'managed', creating: 'created', optimizing: 'optimized',
  architecting: 'architected', delivering: 'delivered', driving: 'drove', establishing: 'established',
  automating: 'automated', streamlining: 'streamlined', mentoring: 'mentored', coordinating: 'coordinated',
  analyzing: 'analyzed', migrating: 'migrated', scaling: 'scaled', shipping: 'shipped',
}

/**
 * Rewrites a bullet's weak lead-in ("Responsible for managing...") into a
 * direct action verb ("Managed...") by reusing only words already in the
 * bullet — no invented scope, metrics, or outcomes. Returns null when the
 * bullet doesn't match a recognized weak lead-in + gerund pattern; there's
 * no safe mechanical fix for arbitrary phrasing, and none at all for a
 * missing metric, so those stay guidance-only.
 */
export function suggestActionVerbRewrite(bullet: string): string | null {
  const trimmed = bullet.trim()
  const leadInMatch = trimmed.match(WEAK_LEAD_IN_RE)
  if (!leadInMatch) return null

  const rest = trimmed.slice(leadInMatch[0].length)
  const gerundMatch = rest.match(/^([a-zA-Z]+)(?=\s|$)/)
  if (!gerundMatch) return null

  const actionVerb = GERUND_TO_ACTION_VERB[gerundMatch[1].toLowerCase()]
  if (!actionVerb) return null

  const remainder = rest.slice(gerundMatch[1].length)
  const capitalized = actionVerb.charAt(0).toUpperCase() + actionVerb.slice(1)
  return `${capitalized}${remainder}`
}
