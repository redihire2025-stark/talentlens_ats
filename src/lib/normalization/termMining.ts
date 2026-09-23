import type { SynonymGroup } from './skillSynonyms'

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Variants of two characters or fewer ("go", "js", "ts", "r") are never mined from prose — far too likely to collide with ordinary English. */
export const MIN_MINEABLE_VARIANT_LENGTH = 3

/**
 * Variants that are also common English words ("the rest of the team",
 * "next quarter", "a node in the graph"). Skipped when mining *resume
 * bullets* for technologies, where a false positive would put a skill in
 * the candidate's mouth they never claimed. (The JD prose miner keeps its
 * original behavior — a false positive there is a mention, not a claim
 * about the candidate.) Longer, unambiguous variants of the same skill
 * ("node.js", "rest api", "next.js") are still matched.
 */
export const AMBIGUOUS_PROSE_VARIANTS: ReadonlySet<string> = new Set(['rest', 'next', 'node', 'express', 'spring', 'swift'])

export interface TaxonomyMention {
  canonical: string
  /** The text as it literally appears in the input (original casing), e.g. "React.js". */
  matchedText: string
}

export interface FindTaxonomyMentionsOptions {
  /** Canonical terms to skip (already found elsewhere). */
  exclude?: ReadonlySet<string>
  /** Individual variants to never match on. */
  skipVariants?: ReadonlySet<string>
}

/**
 * Whole-word/phrase search for every taxonomy group mentioned in `text`,
 * in dictionary order, one mention per canonical term. Within a group, the
 * longest variant is tried first so "React.js" is reported as "React.js",
 * not "React". Shared by the JD prose miner (`extractProseSkills.ts`) and
 * the resume bullet builder (`buildExperienceBullet`).
 */
export function findTaxonomyMentions(text: string, dictionary: readonly SynonymGroup[], options: FindTaxonomyMentionsOptions = {}): TaxonomyMention[] {
  const found: TaxonomyMention[] = []
  const seen = new Set<string>(options.exclude ?? [])

  for (const group of dictionary) {
    if (seen.has(group.canonical)) continue
    const variants = group.variants
      .filter((variant) => variant.length >= MIN_MINEABLE_VARIANT_LENGTH && !options.skipVariants?.has(variant))
      .sort((a, b) => b.length - a.length)

    for (const variant of variants) {
      // `\b` only works next to a word character, so a variant ending in a
      // symbol ("c++", "c#", "ci/cd") uses a lookahead instead.
      const lead = /^\w/.test(variant) ? '\\b' : '(?<![\\w])'
      const trail = /\w$/.test(variant) ? '\\b' : '(?![\\w])'
      const match = text.match(new RegExp(`${lead}${escapeRegExp(variant)}${trail}`, 'i'))
      if (match) {
        seen.add(group.canonical)
        found.push({ canonical: group.canonical, matchedText: match[0] })
        break
      }
    }
  }

  return found
}
