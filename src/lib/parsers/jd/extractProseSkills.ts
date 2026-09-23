import type { SynonymGroup } from '@/lib/normalization/skillSynonyms'

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
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const MIN_MINEABLE_VARIANT_LENGTH = 3

export function mineTermsFromText(text: string, dictionary: readonly SynonymGroup[], exclude: ReadonlySet<string> = new Set()): string[] {
  const found: string[] = []
  const seen = new Set<string>(exclude)

  for (const group of dictionary) {
    if (seen.has(group.canonical)) continue
    const variants = group.variants
      .filter((variant) => variant.length >= MIN_MINEABLE_VARIANT_LENGTH)
      .sort((a, b) => b.length - a.length)

    const matched = variants.some((variant) => new RegExp(`\\b${escapeRegExp(variant)}\\b`, 'i').test(text))
    if (matched) {
      seen.add(group.canonical)
      found.push(group.canonical)
    }
  }

  return found
}
