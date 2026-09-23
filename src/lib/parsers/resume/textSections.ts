export type ResumeSectionName = 'summary' | 'skills' | 'experience' | 'education' | 'certifications' | 'projects' | 'languages' | 'awards'

export type ResumeSections = Record<ResumeSectionName, string[]> & { header: string[] }

const SECTION_ALIASES: Record<ResumeSectionName, string[]> = {
  summary: ['summary', 'professional summary', 'objective', 'profile', 'about'],
  skills: [
    'skills',
    'technical skills',
    'core technical skills',
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
    'skills summary',
    'technical summary',
  ],
  experience: ['experience', 'work experience', 'professional experience', 'employment history', 'work history'],
  education: ['education', 'academic background'],
  certifications: ['certifications', 'certifications & licenses', 'licenses', 'licenses & certifications'],
  projects: ['projects', 'personal projects', 'selected projects', 'side projects'],
  // A bare "Languages" header is ambiguous (spoken vs. programming) — the
  // parser routes a languages section whose items are known technical
  // skills back into `skills`; see `buildLanguages.ts`.
  languages: ['languages', 'spoken languages', 'language skills', 'language proficiency', 'language proficiencies'],
  awards: ['awards', 'honors', 'honors & awards', 'honors and awards', 'awards & honors', 'awards and honors', 'awards & recognition', 'awards and recognition'],
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

/** One recognized section header, in document order. */
export interface DetectedResumeSection {
  name: ResumeSectionName
  /** The header line exactly as written (trimmed). */
  heading: string
}

export interface ResumeLayout {
  sections: ResumeSections
  /** Every recognized header, in the order it appeared — a section named twice appears twice. */
  detected: DetectedResumeSection[]
}

/**
 * Splits raw resume text into named sections by matching lines against a
 * known set of common section-header aliases, and records which headers
 * were seen in what order (the basis for `Resume.sections`). This only
 * recognizes conventional headers (see SECTION_ALIASES) — a resume with
 * unusual or missing headers will have that content fall into `header`
 * (treated as name/contact/summary) rather than being dropped. See
 * docs/architecture/resume-parser.md for known limitations.
 */
export function analyzeResumeLayout(rawText: string): ResumeLayout {
  const sections: ResumeSections = {
    header: [],
    summary: [],
    skills: [],
    experience: [],
    education: [],
    certifications: [],
    projects: [],
    languages: [],
    awards: [],
  }
  const detected: DetectedResumeSection[] = []

  const lines = rawText.split('\n')
  let current: keyof ResumeSections = 'header'

  for (const line of lines) {
    const matchedSection = matchSectionHeader(line)
    if (matchedSection) {
      current = matchedSection
      detected.push({ name: matchedSection, heading: line.trim() })
      continue
    }
    sections[current].push(line)
  }

  return { sections, detected }
}

export function splitResumeSections(rawText: string): ResumeSections {
  return analyzeResumeLayout(rawText).sections
}
