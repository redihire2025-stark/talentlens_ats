import { toLookupKey } from './lookupKey'
import { SKILL_SYNONYM_GROUPS } from './skillSynonyms'

/** Compiled once at module load: lookup key -> canonical skill name. */
export const SKILL_DICTIONARY: ReadonlyMap<string, string> = new Map(
  SKILL_SYNONYM_GROUPS.flatMap((group) => group.variants.map((variant) => [toLookupKey(variant), group.canonical] as const)),
)

/**
 * Canonicalizes a skill name for comparison: known variants ("React.js",
 * "React JS", "ReactJS") all resolve to the same canonical spelling
 * ("react"). A skill with no dictionary entry falls back to a plain
 * lowercase/trim — still comparable, just not merged with any variants.
 */
export function normalizeSkillName(input: string): string {
  const known = SKILL_DICTIONARY.get(toLookupKey(input))
  return known ?? input.trim().toLowerCase()
}
