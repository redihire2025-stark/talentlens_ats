import type { SynonymGroup } from '@/lib/normalization/skillSynonyms'
import { findTaxonomyMentions, type TaxonomyMention } from '@/lib/normalization/termMining'

/**
 * The flagship JD-parser fix called out in the target architecture PRD §9:
 * requirements stated in prose ("3+ years building production React and
 * Node.js applications") must also be extracted, not just comma/pipe/list
 * lines (`buildSkillList.ts`'s job). This reuses the same conservative
 * synonym dictionaries the normalization layer already maintains — it does
 * not invent its own keyword list — and stays deliberately conservative to
 * avoid false positives:
 *
 * - Every variant is matched as a whole word/phrase (`\b...\b`), never a
 *   substring, so "javascript" doesn't match inside "typescript".
 * - Variants of two characters or fewer ("go", "js", "ts", "r") are skipped
 *   entirely — far too likely to collide with ordinary English prose
 *   ("go through", "yes") to mine reliably.
 * - A term already found elsewhere (e.g. already in a comma-separated
 *   skills line) is not duplicated.
 */
export function mineTermsFromText(text: string, dictionary: readonly SynonymGroup[], exclude: ReadonlySet<string> = new Set()): string[] {
  return findTaxonomyMentions(text, dictionary, { exclude }).map((mention) => mention.canonical)
}

/** Like `mineTermsFromText`, but also returns each term's literal spelling in `text` — the JD parser's `JobRequirement.rawText`. */
export function mineMentionsFromText(text: string, dictionary: readonly SynonymGroup[], exclude: ReadonlySet<string> = new Set()): TaxonomyMention[] {
  return findTaxonomyMentions(text, dictionary, { exclude })
}
