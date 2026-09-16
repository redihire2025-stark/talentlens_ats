const BULLET_MARKER_RE = /^[-•*●▪◦‣]\s*/

export function isBulletLine(line: string): boolean {
  return BULLET_MARKER_RE.test(line.trim())
}

export function stripBulletMarker(line: string): string {
  return line.trim().replace(BULLET_MARKER_RE, '').trim()
}
