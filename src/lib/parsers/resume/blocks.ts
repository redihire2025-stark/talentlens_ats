const BULLET_MARKER_RE = /^[-•*●▪◦‣]\s*/

export function isBulletLine(line: string): boolean {
  return BULLET_MARKER_RE.test(line.trim())
}

export function stripBulletMarker(line: string): string {
  return line.trim().replace(BULLET_MARKER_RE, '').trim()
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
