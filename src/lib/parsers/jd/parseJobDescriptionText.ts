import type { JobDescription } from '@/types/jobDescription'
import { stripBulletMarker } from '../shared/lines'
import { splitJobDescriptionSections } from './sections'
import { buildSkillList } from './buildSkillList'
import { mineTermsFromText } from './extractProseSkills'
import { SKILL_SYNONYM_GROUPS } from '@/lib/normalization/skillSynonyms'
import { SOFT_SKILL_GROUPS } from '@/lib/normalization/softSkillDictionary'
import {
  extractDomainTerms,
  extractEmploymentType,
  extractExperienceRequirement,
  extractLocation,
  extractSeniority,
  extractTitle,
} from './fieldExtractors'

/** Below this length, a "job description" is almost certainly a parsing failure or an unrelated document. */
export const MIN_JD_TEXT_LENGTH = 60

export interface ParsedJobDescriptionResult {
  jobDescription: JobDescription
  warnings: string[]
}

function emptyJobDescription(rawText = ''): JobDescription {
  return {
    title: null,
    seniority: null,
    experience: { minimumYears: null, maximumYears: null },
    requiredSkills: [],
    preferredSkills: [],
    responsibilities: [],
    education: [],
    certifications: [],
    location: null,
    employmentType: null,
    keywords: [],
    technologies: [],
    softSkills: [],
    domainTerms: [],
    rawText,
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
  const listedRequiredSkills = buildSkillList(sections.requiredSkills)
  const listedPreferredSkills = buildSkillList(sections.preferredSkills)

  // Flagship JD-parser fix (PRD §9): mine skill mentions out of prose lines
  // too, not just comma/pipe/list lines — conservatively, via the same
  // synonym dictionary the matching engine already trusts. Requirement-
  // section prose is mined into requiredSkills; preferred-section prose
  // into preferredSkills; everything else (responsibilities, overview) is
  // kept separate as `technologies`, since it's a *mention*, not
  // necessarily a stated requirement (see docs/scoring/matching-rules.md's
  // "don't penalize for what the JD never asked for").
  const alreadyFound = new Set([...listedRequiredSkills, ...listedPreferredSkills].map((s) => s.toLowerCase()))
  const requiredSkillsProse = mineTermsFromText(sections.requiredSkills.join('\n'), SKILL_SYNONYM_GROUPS, alreadyFound)
  for (const skill of requiredSkillsProse) alreadyFound.add(skill)
  const preferredSkillsProse = mineTermsFromText(sections.preferredSkills.join('\n'), SKILL_SYNONYM_GROUPS, alreadyFound)
  for (const skill of preferredSkillsProse) alreadyFound.add(skill)

  const requiredSkills = [...listedRequiredSkills, ...requiredSkillsProse]
  const preferredSkills = [...listedPreferredSkills, ...preferredSkillsProse]

  const bodyText = [...sections.header, ...sections.responsibilities, ...sections.education, ...sections.certifications].join('\n')
  const technologies = mineTermsFromText(bodyText, SKILL_SYNONYM_GROUPS, alreadyFound)
  const softSkills = mineTermsFromText(trimmed, SOFT_SKILL_GROUPS)

  const keywordExcludeSet = new Set([...requiredSkills, ...preferredSkills, ...technologies].map((s) => s.toLowerCase()))
  const domainTerms = extractDomainTerms(trimmed, keywordExcludeSet)

  const title = extractTitle(sections.header)

  const jobDescription: JobDescription = {
    title,
    seniority: extractSeniority(title, trimmed),
    experience: extractExperienceRequirement(trimmed),
    requiredSkills,
    preferredSkills,
    responsibilities: linesToList(sections.responsibilities),
    education: linesToList(sections.education),
    certifications: linesToList(sections.certifications),
    location: extractLocation(trimmed),
    employmentType: extractEmploymentType(trimmed),
    keywords: [...new Set([...requiredSkills, ...preferredSkills].map((s) => s.toLowerCase()))],
    technologies,
    softSkills,
    domainTerms,
    rawText: trimmed,
  }

  if (jobDescription.requiredSkills.length === 0 && jobDescription.preferredSkills.length === 0) {
    warnings.push('No clearly listed skills were found — look for a "Requirements" or "Skills" section.')
  }
  if (jobDescription.responsibilities.length === 0) {
    warnings.push('No responsibilities section was detected.')
  }

  return { jobDescription, warnings }
}
