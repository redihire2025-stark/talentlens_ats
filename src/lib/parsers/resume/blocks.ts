import { isBulletLine, stripBulletMarker } from '../shared/lines'

export { isBulletLine, stripBulletMarker }

/**
 * Joins a run of lines that start at a bullet marker into complete bullet
 * strings, folding in any non-bulleted continuation lines that follow a
 * bullet (a bullet wrapped across two lines by the extractor — very common
 * for a bullet long enough to wrap at the page width) rather than treating
 * each wrapped line as its own separate, truncated bullet.
 *
 * If the run contains no bullet markers at all (a paragraph-style entry
 * with no bullets), each line is kept as its own item unchanged — merging
 * unrelated paragraph lines together would be worse than the status quo,
 * and `formattingAnalyzer.ts` already flags the lack of bullets as a risk
 * on its own.
 */
export function mergeWrappedBulletLines(lines: string[]): string[] {
  if (!lines.some(isBulletLine)) {
    return lines.map((line) => line.trim()).filter(Boolean)
  }

  const merged: string[] = []
  for (const line of lines) {
    if (isBulletLine(line)) {
      merged.push(stripBulletMarker(line))
    } else if (merged.length > 0) {
      merged[merged.length - 1] = `${merged[merged.length - 1]} ${line.trim()}`.trim()
    }
    // A non-bullet line before any bullet marker has appeared is dropped;
    // `parseExperienceBlock` only ever passes lines starting at the first
    // bullet marker, so this branch isn't reached in practice.
  }
  return merged.filter(Boolean)
}

/** Splits a section's lines into blank-line-separated blocks (one per entry), dropping empty blocks. */
export function splitIntoBlocks(lines: string[]): string[][] {
  const blocks: string[][] = []
  let current: string[] = []

  for (const line of lines) {
    if (line.trim() === '') {
      if (current.length > 0) blocks.push(current)
      current = []
      continue
    }
    current.push(line)
  }
  if (current.length > 0) blocks.push(current)

  return blocks
}
