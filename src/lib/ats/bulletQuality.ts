export const ACTION_VERBS = [
  'built', 'led', 'developed', 'designed', 'implemented', 'launched', 'improved', 'increased', 'reduced',
  'managed', 'created', 'optimized', 'architected', 'delivered', 'drove', 'established', 'automated',
  'streamlined', 'mentored', 'coordinated', 'analyzed', 'migrated', 'scaled', 'shipped',
]
const QUANTIFICATION_RE = /\d/

/** Shared by contentQualityAnalyzer.ts and the recommendation engine (TASK-011) so both judge bullets the same way. */
export function startsWithActionVerb(bullet: string): boolean {
  return leadingActionVerb(bullet) !== null
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

/** Removes a recognized weak lead-in ("Responsible for …") from the front of a bullet, returning the remainder unchanged otherwise. Used to state a bullet's underlying responsibility (`ExperienceBullet.responsibilities`). */
export function stripWeakLeadIn(bullet: string): string {
  const trimmed = bullet.trim()
  const leadInMatch = trimmed.match(WEAK_LEAD_IN_RE)
  return leadInMatch ? trimmed.slice(leadInMatch[0].length).trim() : trimmed
}

/** The bullet's opening word, lowercased, when it's on `ACTION_VERBS`; null otherwise. */
export function leadingActionVerb(bullet: string): string | null {
  const firstWord = bullet.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '')
  return firstWord && ACTION_VERBS.includes(firstWord) ? firstWord : null
}

/**
 * Rewrites a bullet's weak lead-in ("Responsible for managing...") into a
 * direct action verb ("Managed...") by reusing only words already in the
 * bullet — no invented scope, metrics, or outcomes. Returns null when the
 * bullet doesn't match a recognized weak lead-in + gerund pattern.
 */
export function suggestActionVerbRewrite(bullet: string): string | null {
  const trimmed = bullet.trim()
  const leadInMatch = trimmed.match(WEAK_LEAD_IN_RE)
  if (!leadInMatch) return null

  const rest = trimmed.slice(leadInMatch[0].length)
  return rewriteGerundOpener(rest)
}

/** If `text` starts with a recognized gerund ("Managing…"), rewrites just that opening word to its past-tense action-verb form ("Managed…"). Returns null when the opener isn't a recognized gerund. */
function rewriteGerundOpener(text: string): string | null {
  const gerundMatch = text.match(/^([a-zA-Z]+)(?=\s|$)/)
  if (!gerundMatch) return null

  const actionVerb = GERUND_TO_ACTION_VERB[gerundMatch[1].toLowerCase()]
  if (!actionVerb) return null

  const remainder = text.slice(gerundMatch[1].length)
  const capitalized = actionVerb.charAt(0).toUpperCase() + actionVerb.slice(1)
  return `${capitalized}${remainder}`
}

/**
 * Always returns a usable, non-fabricating suggested bullet — the
 * deterministic baseline every bullet-impact recommendation shows
 * up-front (never a blank "no suggestion available"), which an AI-drafted
 * rewrite (`src/lib/ai/`) may then optionally upgrade. It only ever
 * reorders/reuses words already in the bullet:
 *
 * 1. A recognized weak lead-in ("Responsible for managing...") becomes a
 *    direct action verb ("Managed...").
 * 2. A bare gerund opener with no lead-in phrase ("Managing a team...")
 *    becomes its past-tense form ("Managed a team...").
 * 3. A first-person opener ("I led the migration...") drops the "I ".
 * 4. Otherwise (the bullet already starts with a strong action verb, or no
 *    safe mechanical fix applies — most commonly, the only issue is a
 *    missing metric, and no rewrite can invent one) the bullet is returned
 *    unchanged: an honest "nothing more to safely suggest" rather than a
 *    fabricated improvement.
 */
export function buildDeterministicBulletSuggestion(bullet: string): string {
  const trimmed = bullet.trim()

  const leadInRewrite = suggestActionVerbRewrite(trimmed)
  if (leadInRewrite) return leadInRewrite

  if (!startsWithActionVerb(trimmed)) {
    const bareGerundRewrite = rewriteGerundOpener(trimmed)
    if (bareGerundRewrite) return bareGerundRewrite
  }

  const firstPersonMatch = trimmed.match(/^I\s+(.+)$/)
  if (firstPersonMatch) {
    const rest = firstPersonMatch[1]!
    return rest.charAt(0).toUpperCase() + rest.slice(1)
  }

  return trimmed
}
