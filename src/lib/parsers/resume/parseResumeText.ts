import type { Resume } from '@/types/resume'
import { splitResumeSections } from './textSections'
import { buildCandidate, buildSummary } from './buildCandidate'
import { buildSkills } from './buildSkills'
import { buildExperience } from './buildExperience'
import { buildEducation } from './buildEducation'
import { buildCertifications } from './buildCertifications'
import { buildProjects } from './buildProjects'

/** Below this length, a "resume" is almost certainly a parsing failure or an unrelated document. */
export const MIN_RESUME_TEXT_LENGTH = 100

export interface ParsedResumeResult {
  resume: Resume
  warnings: string[]
}

function emptyResume(): Resume {
  return {
    candidate: { name: null, email: null, phone: null, location: null, links: [] },
    summary: null,
    skills: [],
    experience: [],
    education: [],
    certifications: [],
    projects: [],
  }
}

/**
 * Deterministic, rule-based text → Resume conversion. No network calls, no
 * LLM, no randomness — the same text always produces the same Resume. See
 * docs/architecture/resume-parser.md for the section-detection and
 * entry-parsing conventions this relies on, and their known limitations.
 */
export function parseResumeText(rawText: string): ParsedResumeResult {
  const warnings: string[] = []
  const trimmed = rawText.trim()

  if (trimmed.length === 0) {
    warnings.push('No text could be extracted from this document.')
    return { resume: emptyResume(), warnings }
  }
  if (trimmed.length < MIN_RESUME_TEXT_LENGTH) {
    warnings.push('This document is very short for a resume — parsing may be incomplete.')
  }

  const sections = splitResumeSections(trimmed)
  const candidate = buildCandidate(sections.header)
  const summary = buildSummary(sections.header, sections.summary, candidate)
  const skills = buildSkills(sections.skills)
  const experience = buildExperience(sections.experience, warnings)
  const education = buildEducation(sections.education)
  const certifications = buildCertifications(sections.certifications)
  const projects = buildProjects(sections.projects)

  if (!candidate.email && !candidate.phone) {
    warnings.push('No email or phone number was found — verify contact info manually.')
  }
  if (skills.length === 0) {
    warnings.push('No skills section was detected.')
  }
  if (experience.length === 0) {
    warnings.push('No work experience was detected.')
  }

  return {
    resume: { candidate, summary, skills, experience, education, certifications, projects },
    warnings,
  }
}
