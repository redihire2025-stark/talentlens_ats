import type { JobDescription } from '@/types/jobDescription'
import { stripBulletMarker } from '../shared/lines'
import { splitJobDescriptionSections } from './sections'
import { buildSkillList } from './buildSkillList'
import { extractEmploymentType, extractExperienceRequirement, extractLocation, extractTitle } from './fieldExtractors'

/** Below this length, a "job description" is almost certainly a parsing failure or an unrelated document. */
export const MIN_JD_TEXT_LENGTH = 60

export interface ParsedJobDescriptionResult {
  jobDescription: JobDescription
  warnings: string[]
}

function emptyJobDescription(): JobDescription {
  return {
    title: null,
    experience: { minimumYears: null, maximumYears: null },
    requiredSkills: [],
    preferredSkills: [],
    responsibilities: [],
    education: [],
    certifications: [],
    location: null,
    employmentType: null,
    keywords: [],
  }
}

function linesToList(lines: string[]): string[] {
  return lines.map(stripBulletMarker).filter(Boolean)
}

/**
 * Deterministic, rule-based text → JobDescription conversion — the JD
 * counterpart to `parseResumeText` (see docs/architecture/resume-parser.md
 * for the shared design philosophy). No network calls, no LLM.
 */
export function parseJobDescriptionText(rawText: string): ParsedJobDescriptionResult {
  const warnings: string[] = []
  const trimmed = rawText.trim()

  if (trimmed.length === 0) {
    warnings.push('No text could be extracted from this document.')
    return { jobDescription: emptyJobDescription(), warnings }
  }
  if (trimmed.length < MIN_JD_TEXT_LENGTH) {
    warnings.push('This document is very short for a job description — parsing may be incomplete.')
  }

  const sections = splitJobDescriptionSections(trimmed)
  const requiredSkills = buildSkillList(sections.requiredSkills)
  const preferredSkills = buildSkillList(sections.preferredSkills)

  const jobDescription: JobDescription = {
    title: extractTitle(sections.header),
    experience: extractExperienceRequirement(trimmed),
    requiredSkills,
    preferredSkills,
    responsibilities: linesToList(sections.responsibilities),
    education: linesToList(sections.education),
    certifications: linesToList(sections.certifications),
    location: extractLocation(trimmed),
    employmentType: extractEmploymentType(trimmed),
    keywords: [...new Set([...requiredSkills, ...preferredSkills].map((s) => s.toLowerCase()))],
  }

  if (jobDescription.requiredSkills.length === 0 && jobDescription.preferredSkills.length === 0) {
    warnings.push('No clearly listed skills were found — look for a "Requirements" or "Skills" section.')
  }
  if (jobDescription.responsibilities.length === 0) {
    warnings.push('No responsibilities section was detected.')
  }

  return { jobDescription, warnings }
}
