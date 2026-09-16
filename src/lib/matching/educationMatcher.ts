import type { MatchInput, EducationMatchResult } from './types'
import { tokenOverlapRatio } from './fuzzyMatch'

const EQUIVALENT_EXPERIENCE_RE = /equivalent experience/i
const FIELD_OVERLAP_THRESHOLD = 0.3

/**
 * Matches each JD education requirement line (free text, e.g. "Bachelor's
 * degree in Computer Science or equivalent experience") against the
 * resume's education entries. A requirement explicitly allowing
 * "equivalent experience" is treated as partially satisfied by relevant
 * work experience alone, rather than an automatic miss for candidates
 * without a degree.
 */
export function matchEducation({ resume, jobDescription }: MatchInput): EducationMatchResult {
  if (jobDescription.education.length === 0) {
    return { status: 'matched', required: false, matchedRequirements: [], missingRequirements: [] }
  }

  const hasAnyDegree = resume.education.some((entry) => Boolean(entry.degree))
  const hasExperience = resume.experience.length > 0

  const matched: string[] = []
  const partial: string[] = []
  const missing: string[] = []

  for (const requirement of jobDescription.education) {
    const bestFieldOverlap = Math.max(
      0,
      ...resume.education.map((entry) => tokenOverlapRatio(requirement, `${entry.degree ?? ''} ${entry.fieldOfStudy ?? ''}`)),
    )

    if (hasAnyDegree && bestFieldOverlap >= FIELD_OVERLAP_THRESHOLD) {
      matched.push(requirement)
    } else if (hasAnyDegree) {
      partial.push(requirement)
    } else if (EQUIVALENT_EXPERIENCE_RE.test(requirement) && hasExperience) {
      partial.push(requirement)
    } else {
      missing.push(requirement)
    }
  }

  const status = missing.length === 0 ? (partial.length === 0 ? 'matched' : 'partial') : matched.length > 0 || partial.length > 0 ? 'partial' : 'missing'

  return {
    status,
    required: true,
    matchedRequirements: matched,
    missingRequirements: [...partial, ...missing],
  }
}
