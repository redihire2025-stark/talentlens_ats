import type { MatchStatus } from '@/types/score'
import { explicitEvidence, structuralEvidence } from '@/lib/schema/evidence'
import type { MatchInput, EducationMatchResult, EducationRequirementMatch } from './types'
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
    return { status: 'matched', required: false, requirements: [], matchedRequirements: [], missingRequirements: [] }
  }

  const degreeEntries = resume.education.filter((entry) => Boolean(entry.degree))
  const hasExperience = resume.experience.length > 0

  const requirements: EducationRequirementMatch[] = jobDescription.education.map((requirement) => {
    const scored = resume.education.map((entry) => ({
      entry,
      overlap: tokenOverlapRatio(requirement.rawText, `${entry.degree ?? ''} ${entry.fieldOfStudy ?? ''}`),
    }))
    const best = scored.reduce<(typeof scored)[number] | null>((top, s) => (!top || s.overlap > top.overlap ? s : top), null)
    const base = { requirementId: requirement.id, requirement: requirement.rawText }

    if (degreeEntries.length > 0 && best && best.overlap >= FIELD_OVERLAP_THRESHOLD) {
      return {
        ...base,
        status: 'matched' as MatchStatus,
        evidence: best.entry.evidence,
        reason: `Your education (${[best.entry.degree, best.entry.fieldOfStudy].filter(Boolean).join(', ')}) matches "${requirement.rawText}".`,
      }
    }
    if (degreeEntries.length > 0) {
      return {
        ...base,
        status: 'partial' as MatchStatus,
        evidence: degreeEntries.map((entry) => explicitEvidence(entry.degree!, 'education', entry.id)),
        reason: `Your resume lists a degree (${degreeEntries.map((e) => e.degree).join('; ')}), but it doesn't clearly match "${requirement.rawText}".`,
      }
    }
    if (EQUIVALENT_EXPERIENCE_RE.test(requirement.rawText) && hasExperience) {
      return {
        ...base,
        status: 'partial' as MatchStatus,
        // No single quote proves "equivalent experience" — the structural fact that work experience exists is what's being credited.
        evidence: [
          structuralEvidence(
            `${resume.experience.length} work experience ${resume.experience.length === 1 ? 'entry' : 'entries'} listed; no degree listed.`,
            'experience',
          ),
        ],
        reason: `The job accepts equivalent experience, and your resume shows work experience — but no matching degree is listed.`,
      }
    }
    return {
      ...base,
      status: 'missing' as MatchStatus,
      evidence: [],
      reason: `No degree matching "${requirement.rawText}" was found in your resume's education section.`,
    }
  })

  const matched = requirements.filter((r) => r.status === 'matched')
  const partial = requirements.filter((r) => r.status === 'partial')
  const missing = requirements.filter((r) => r.status === 'missing')

  const status: MatchStatus =
    missing.length === 0 ? (partial.length === 0 ? 'matched' : 'partial') : matched.length > 0 || partial.length > 0 ? 'partial' : 'missing'

  return {
    status,
    required: true,
    requirements,
    matchedRequirements: matched.map((r) => r.requirement),
    missingRequirements: [...partial, ...missing].map((r) => r.requirement),
  }
}
