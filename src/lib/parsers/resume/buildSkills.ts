import type { Skill, SkillCategory } from '@/types/resume'

const LABEL_TO_CATEGORY: [pattern: RegExp, category: SkillCategory][] = [
  [/language/i, 'language'],
  [/framework/i, 'framework'],
  [/librar/i, 'library'],
  [/database/i, 'database'],
  [/(platform|cloud)/i, 'platform'],
  [/tool/i, 'tool'],
  [/(method|practice|process)/i, 'methodology'],
  [/soft/i, 'soft-skill'],
]

function categoryForLabel(label: string): SkillCategory {
  for (const [pattern, category] of LABEL_TO_CATEGORY) {
    if (pattern.test(label)) return category
  }
  return 'other'
}

/**
 * Splits a "Skills" section into individual skills. Lines are often
 * grouped under a label ("Languages: JavaScript, TypeScript"), which gives
 * a reasonable default category; full canonicalization (React.js → react)
 * happens in the normalization engine (TASK-007), not here.
 */
export function buildSkills(skillLines: string[]): Skill[] {
  const skills: Skill[] = []
  const seen = new Set<string>()

  for (const rawLine of skillLines) {
    const line = rawLine.trim().replace(/^[-•*●▪◦‣]\s*/, '')
    if (!line) continue

    const labelMatch = line.match(/^([^:]{2,30}):\s*(.+)$/)
    const label = labelMatch?.[1] ?? ''
    const rest = labelMatch?.[2] ?? line
    const category = categoryForLabel(label)

    const names = rest
      .split(/[,;|•]/)
      .map((name) => name.trim())
      .filter(Boolean)

    for (const name of names) {
      const key = name.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      skills.push({ name, category, evidence: [line] })
    }
  }

  return skills
}
