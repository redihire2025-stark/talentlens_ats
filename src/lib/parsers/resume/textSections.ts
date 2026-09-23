export type ResumeSectionName = 'summary' | 'skills' | 'experience' | 'education' | 'certifications' | 'projects'

export type ResumeSections = Record<ResumeSectionName, string[]> & { header: string[] }

const SECTION_ALIASES: Record<ResumeSectionName, string[]> = {
  summary: ['summary', 'professional summary', 'objective', 'profile', 'about'],
  skills: [
    'skills',
    'technical skills',
    'core competencies',
    'competencies',
    'technologies',
    'skills & technologies',
    'skills and technologies',
    'tech stack',
    'technical proficiencies',
    'technical skills & tools',
    'technical skills and tools',
    'skills & tools',
    'areas of expertise',
    'key skills',
  ],
  experience: ['experience', 'work experience', 'professional experience', 'employment history', 'work history'],
  education: ['education', 'academic background'],
  certifications: ['certifications', 'certifications & licenses', 'licenses', 'licenses & certifications'],
  projects: ['projects', 'personal projects', 'selected projects', 'side projects'],
}

function normalizeHeaderCandidate(line: string): string {
  return line
    .trim()
    .toLowerCase()
    .replace(/[:.]+$/, '')
    .replace(/\s+/g, ' ')
}

function matchSectionHeader(line: string): ResumeSectionName | null {
  const normalized = normalizeHeaderCandidate(line)
  if (!normalized || normalized.length > 40) return null
  for (const [section, aliases] of Object.entries(SECTION_ALIASES) as [ResumeSectionName, string[]][]) {
    if (aliases.includes(normalized)) return section
  }
  return null
}

/**
 * Splits raw resume text into named sections by matching lines against a
 * known set of common section-header aliases. This only recognizes
 * conventional headers (see SECTION_ALIASES) — a resume with unusual or
 * missing headers will have that content fall into `header` (treated as
 * name/contact/summary) rather than being dropped. See
 * docs/architecture/resume-parser.md for known limitations.
 */
export function splitResumeSections(rawText: string): ResumeSections {
  const sections: ResumeSections = {
    header: [],
    summary: [],
    skills: [],
    experience: [],
    education: [],
    certifications: [],
    projects: [],
  }

  const lines = rawText.split('\n')
  let current: keyof ResumeSections = 'header'

  for (const line of lines) {
    const matchedSection = matchSectionHeader(line)
    if (matchedSection) {
      current = matchedSection
      continue
    }
    sections[current].push(line)
  }

  return sections
}
