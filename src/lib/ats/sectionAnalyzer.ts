import type { AnalyzerResult, AtsAnalysisInput } from './types'

interface SectionCheck {
  label: string
  weight: number
  present: (input: AtsAnalysisInput) => boolean
}

const SECTION_CHECKS: SectionCheck[] = [
  { label: 'Name', weight: 15, present: ({ resume }) => Boolean(resume.candidate.name) },
  { label: 'Contact info (email or phone)', weight: 15, present: ({ resume }) => Boolean(resume.candidate.email || resume.candidate.phone) },
  { label: 'Summary', weight: 10, present: ({ resume }) => Boolean(resume.summary) },
  { label: 'Skills section', weight: 20, present: ({ resume }) => resume.skills.length > 0 },
  { label: 'Experience section', weight: 30, present: ({ resume }) => resume.experience.length > 0 },
  { label: 'Education section', weight: 10, present: ({ resume }) => resume.education.length > 0 },
]

const TOTAL_WEIGHT = SECTION_CHECKS.reduce((sum, check) => sum + check.weight, 0)

/**
 * Checks for the presence of the sections and contact fields a resume
 * needs to be screened at all. Weighted rather than a flat count —
 * missing "Experience" is a much bigger problem than missing "Summary".
 */
export function analyzeSections(input: AtsAnalysisInput): AnalyzerResult {
  const present: string[] = []
  const missing: string[] = []
  let earnedWeight = 0

  for (const check of SECTION_CHECKS) {
    if (check.present(input)) {
      earnedWeight += check.weight
      present.push(check.label)
    } else {
      missing.push(check.label)
    }
  }

  const score = Math.round((earnedWeight / TOTAL_WEIGHT) * 100)

  return {
    score,
    strengths: present.map((label) => `${label} found.`),
    issues: missing.map((label) => `${label} not found.`),
    explanation:
      missing.length === 0
        ? 'All standard resume sections were found.'
        : `Missing: ${missing.join(', ')}.`,
  }
}
