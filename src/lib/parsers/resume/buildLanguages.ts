import type { LanguageEntry } from '@/types/resume'
import { buildLanguageEntry } from '@/lib/schema/resumeBuilders'
import { SKILL_DICTIONARY } from '@/lib/normalization/skillDictionary'
import { toLookupKey } from '@/lib/normalization/lookupKey'
import { stripBulletMarker } from './blocks'

const SECTION_LABEL_RE = /^(?:spoken\s+|human\s+)?languages?\s*:\s*/i
const PAREN_PROFICIENCY_RE = /^(.+?)\s*\(([^)]+)\)$/
const SEPARATED_PROFICIENCY_RE = /^(.+?)\s*(?:\s[-–—]\s|:)\s*(.+)$/

export interface LanguagesSectionResult {
  languages: LanguageEntry[]
  /**
   * Lines to treat as skills instead. A bare "Languages" header is
   * ambiguous — many resumes use it for *programming* languages. When any
   * item in the section is a known technical skill (it's in the skill
   * taxonomy), the whole section is handed back to the skills parser rather
   * than recording "JavaScript" as a spoken language.
   */
  skillLines: string[]
}

function splitItems(line: string): string[] {
  return stripBulletMarker(line)
    .replace(SECTION_LABEL_RE, '')
    .split(/[,;|•]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseItem(item: string): { name: string; proficiency: string | null } {
  const paren = item.match(PAREN_PROFICIENCY_RE)
  if (paren) return { name: paren[1]!.trim(), proficiency: paren[2]!.trim() }
  const separated = item.match(SEPARATED_PROFICIENCY_RE)
  if (separated) return { name: separated[1]!.trim(), proficiency: separated[2]!.trim() }
  return { name: item, proficiency: null }
}

/** Parses a "Languages" section into `LanguageEntry`s ("English (Native), Spanish – Fluent"), each quoting its source line. */
export function buildLanguages(lines: string[]): LanguagesSectionResult {
  const contentLines = lines.map((line) => line.trim()).filter(Boolean)
  const parsed = contentLines.flatMap((line) => splitItems(line).map((item) => ({ ...parseItem(item), sourceLine: line })))

  const looksTechnical = parsed.some((item) => SKILL_DICTIONARY.has(toLookupKey(item.name)))
  if (looksTechnical) return { languages: [], skillLines: contentLines }

  return {
    languages: parsed.map((item, index) => buildLanguageEntry(item, index)),
    skillLines: [],
  }
}
