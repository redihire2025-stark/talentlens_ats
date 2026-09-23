import type { Resume, ResumeMetadata, ResumeSection } from '@/types/resume'
import { emptyResume, linkSkillEvidence } from '@/lib/schema/resumeBuilders'
import { hashText } from '@/lib/schema/ids'
import { analyzeResumeLayout, type ResumeLayout } from './textSections'
import { buildContact, buildSummary } from './buildContact'
import { buildSkills } from './buildSkills'
import { buildExperience } from './buildExperience'
import { buildEducation } from './buildEducation'
import { buildCertifications } from './buildCertifications'
import { buildProjects } from './buildProjects'
import { buildLanguages } from './buildLanguages'
import { buildAwards } from './buildAwards'

/** Below this length, a "resume" is almost certainly a parsing failure or an unrelated document. */
export const MIN_RESUME_TEXT_LENGTH = 100

export interface ParsedResumeResult {
  resume: Resume
  /** Same list as `resume.parserWarnings` — returned alongside for callers that only need the warnings. */
  warnings: string[]
}

export interface ParseResumeTextOptions {
  /** The uploaded file's format; `text` (the default) when the text didn't come from a file. */
  sourceFormat?: ResumeMetadata['sourceFormat']
}

function countLines(lines: string[]): number {
  return lines.filter((line) => line.trim() !== '').length
}

/** `Resume.sections`: the implicit header block (when it has content) followed by every recognized header, in document order. */
function buildSections(layout: ResumeLayout): ResumeSection[] {
  const sections: ResumeSection[] = []
  const headerLineCount = countLines(layout.sections.header)
  if (headerLineCount > 0) {
    sections.push({ id: 'section-0', type: 'contact', heading: null, order: 0, lineCount: headerLineCount })
  }
  for (const detected of layout.detected) {
    const order = sections.length
    sections.push({
      id: `section-${order}`,
      type: detected.name,
      heading: detected.heading,
      order,
      // A section named twice shares one line bucket, so both entries report the bucket's total.
      lineCount: countLines(layout.sections[detected.name]),
    })
  }
  return sections
}

/**
 * Deterministic, rule-based text → Resume conversion. No network calls, no
 * LLM, no randomness, no clock — the same text always produces a `toEqual`
 * Resume (ids are positional or content-hashed). See
 * docs/architecture/resume-parser.md for the section-detection and
 * entry-parsing conventions this relies on, and their known limitations.
 */
export function parseResumeText(rawText: string, options: ParseResumeTextOptions = {}): ParsedResumeResult {
  const warnings: string[] = []
  const trimmed = rawText.trim()
  const metadata: ResumeMetadata = {
    sourceFormat: options.sourceFormat ?? 'text',
    characterCount: trimmed.length,
    lineCount: countLines(trimmed.split('\n')),
  }

  if (trimmed.length === 0) {
    warnings.push('No text could be extracted from this document.')
    return { resume: emptyResume({ id: `resume-${hashText('')}`, metadata, parserWarnings: [...warnings] }), warnings }
  }
  if (trimmed.length < MIN_RESUME_TEXT_LENGTH) {
    warnings.push('This document is very short for a resume — parsing may be incomplete.')
  }

  const layout = analyzeResumeLayout(trimmed)
  const { sections } = layout
  const { languages, skillLines: languageSkillLines } = buildLanguages(sections.languages)

  const contact = buildContact(sections.header)
  const summary = buildSummary(sections.header, sections.summary, contact)
  const skills = buildSkills([...sections.skills, ...languageSkillLines])
  const experience = buildExperience(sections.experience, warnings)
  const education = buildEducation(sections.education)
  const certifications = buildCertifications(sections.certifications)
  const projects = buildProjects(sections.projects)
  const awards = buildAwards(sections.awards)

  if (!contact.email && !contact.phone) {
    warnings.push('No email or phone number was found — verify contact info manually.')
  }
  if (skills.length === 0) {
    warnings.push('No skills section was detected.')
  }
  if (experience.length === 0) {
    warnings.push('No work experience was detected.')
  }

  const resume = linkSkillEvidence(
    emptyResume({
      id: `resume-${hashText(trimmed)}`,
      metadata,
      contact,
      summary,
      skills,
      experience,
      education,
      certifications,
      projects,
      languages,
      awards,
      sections: buildSections(layout),
      parserWarnings: [...warnings],
    }),
  )

  return { resume, warnings }
}
