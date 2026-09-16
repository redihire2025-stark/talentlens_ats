const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'your', 'you', 'our', 'are', 'was', 'were',
  'will', 'have', 'has', 'had', 'not', 'but', 'all', 'can', 'able', 'using', 'used', 'use', 'per',
])

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2 && !STOP_WORDS.has(token)),
  )
}

/**
 * How much two short phrases overlap, as a fraction of the *smaller* set's
 * tokens (not a strict Jaccard union) — comparing a short JD requirement
 * against a longer resume bullet shouldn't be penalized just because the
 * bullet has more words overall. Deliberately simple and conservative: no
 * stemming, no synonym expansion (that's the skill/title dictionaries'
 * job) — this is the last-resort "fuzzy" layer, not the primary one, per
 * docs/scoring/matching-rules.md's warning against overly aggressive
 * matching.
 */
export function tokenOverlapRatio(a: string, b: string): number {
  const tokensA = tokenize(a)
  const tokensB = tokenize(b)
  if (tokensA.size === 0 || tokensB.size === 0) return 0

  let intersection = 0
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection += 1
  }

  return intersection / Math.min(tokensA.size, tokensB.size)
}
