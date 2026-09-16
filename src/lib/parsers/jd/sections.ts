export type JdSectionName = 'requiredSkills' | 'preferredSkills' | 'responsibilities' | 'education' | 'certifications'

export type JdSections = Record<JdSectionName, string[]> & { header: string[] }

const SECTION_ALIASES: Record<JdSectionName, string[]> = {
  requiredSkills: ['requirements', 'required skills', 'required qualifications', 'qualifications', 'skills', 'must have'],
  preferredSkills: ['preferred qualifications', 'preferred skills', 'nice to have', 'bonus points', 'bonus skills'],
  responsibilities: ['responsibilities', "what you'll do", 'what you will do', 'the role', 'duties'],
  education: ['education', 'education requirements'],
  certifications: ['certifications', 'licenses', 'certifications & licenses'],
}

function normalizeHeaderCandidate(line: string): string {
  return line
    .trim()
    .toLowerCase()
    .replace(/[:.]+$/, '')
    .replace(/\s+/g, ' ')
}

function matchSectionHeader(line: string): JdSectionName | null {
  const normalized = normalizeHeaderCandidate(line)
  if (!normalized || normalized.length > 40) return null
  for (const [section, aliases] of Object.entries(SECTION_ALIASES) as [JdSectionName, string[]][]) {
    if (aliases.includes(normalized)) return section
  }
  return null
}

/**
 * Splits raw JD text into named sections by matching lines against known
 * header aliases — same approach as the resume parser's
 * `splitResumeSections` (see docs/architecture/resume-parser.md), with a
 * JD-specific alias set. Unrecognized headers fall into `header` rather
 * than being dropped.
 */
export function splitJobDescriptionSections(rawText: string): JdSections {
  const sections: JdSections = {
    header: [],
    requiredSkills: [],
    preferredSkills: [],
    responsibilities: [],
    education: [],
    certifications: [],
  }

  let current: keyof JdSections = 'header'
  for (const line of rawText.split('\n')) {
    const matchedSection = matchSectionHeader(line)
    if (matchedSection) {
      current = matchedSection
      continue
    }
    sections[current].push(line)
  }

  return sections
}
