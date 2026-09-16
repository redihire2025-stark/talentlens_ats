import { extractDateRange } from './dateUtils'

/**
 * Splits a section's lines into entries by treating each line containing a
 * recognizable date range as the start of a new entry, rather than relying
 * on blank lines between entries.
 *
 * This exists because blank-line spacing is not a reliable signal across
 * document formats: pdf.js's line-break approximation (`hasEOL`) usually
 * preserves a real blank line between resume entries, but mammoth's plain
 * text extraction inserts a blank line after *every* paragraph (bullet
 * points included) and drops genuinely empty paragraphs entirely — so for
 * DOCX input, blank-line splitting would treat every single bullet as its
 * own entry. Anchoring on date ranges instead works for both formats, as
 * long as each entry's meta line states its dates (as experience and
 * education entries conventionally do — see `blocks.ts`'s `splitIntoBlocks`
 * for sections, like projects, that don't reliably have dates).
 *
 * Trade-off: a bullet that happens to mention a bare 4-digit number read
 * as a year (e.g. "migrated a system built in 2015") would incorrectly
 * start a new entry. This is judged rarer and less damaging than the
 * failure mode it replaces.
 */
export function splitByDateBoundary(lines: string[]): string[][] {
  const nonEmpty = lines.map((line) => line.trim()).filter(Boolean)
  const blocks: string[][] = []
  let current: string[] = []

  for (const line of nonEmpty) {
    if (extractDateRange(line) && current.length > 0) {
      blocks.push(current)
      current = []
    }
    current.push(line)
  }
  if (current.length > 0) blocks.push(current)

  return blocks
}
