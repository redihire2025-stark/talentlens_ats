/**
 * Deterministic 32-bit FNV-1a hash, as 8 lowercase hex characters. Used
 * for content-derived ids (`Resume.id`, `JobDescription.id`) — the same
 * text always hashes to the same id, so repeated analysis of identical
 * input produces `toEqual` results (spec §4). Not cryptographic; it only
 * needs to be stable and reasonably spread.
 */
export function hashText(text: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}
