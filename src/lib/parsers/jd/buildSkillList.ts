/**
 * Pulls flat skill names out of list-like lines only (comma/pipe/semicolon
 * separated, not ending in sentence punctuation) — e.g. "Required Skills:
 * React, TypeScript, Node.js". A full prose bullet ("3+ years building
 * production React applications") isn't a list and is deliberately left
 * alone here; it still shows up in the raw section text, just not as a
 * flat skill token. Canonicalizing the skills this does find (`React.js` →
 * `react`) is the normalization engine's job (TASK-007), not this parser's.
 */
export interface SkillListItem {
  name: string
  /** The list line (bullet marker stripped) the name was split out of. */
  line: string
}

export function buildSkillList(lines: string[]): string[] {
  return buildSkillListItems(lines).map((item) => item.name)
}

/** Same extraction as `buildSkillList`, keeping each name's source line (a `JobRequirement`'s `evidence`). */
export function buildSkillListItems(lines: string[]): SkillListItem[] {
  const skills: SkillListItem[] = []
  const seen = new Set<string>()

  for (const rawLine of lines) {
    const line = rawLine.trim().replace(/^[-•*●▪◦‣]\s*/, '')
    if (!line) continue

    const looksLikeList = /[,;|]/.test(line) && !/[.!?]\s*$/.test(line) && line.split(/\s+/).length <= 20
    if (!looksLikeList) continue

    const labelMatch = line.match(/^([^:]{2,40}):\s*(.+)$/)
    const rest = labelMatch?.[2] ?? line

    for (const token of rest.split(/[,;|]/)) {
      const name = token.trim()
      if (!name) continue
      const key = name.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      skills.push({ name, line })
    }
  }

  return skills
}
