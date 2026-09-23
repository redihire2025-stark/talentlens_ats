import type { Evidence } from '@/types/evidence'
import { explicitEvidence, structuralEvidence } from '@/lib/schema/evidence'
import type { AnalyzerResult, AtsAnalysisInput } from './types'

interface SectionCheck {
  label: string
  weight: number
  present: (input: AtsAnalysisInput) => boolean
  /**
   * What supports "present". A literal quote where one exists (the name,
   * the summary text); a structural observation otherwise — "3 experience
   * entries were detected" isn't a quote of anything, so it's recorded as
   * `inferred-from-structure`, never dressed up as explicit evidence.
   */
  evidence: (input: AtsAnalysisInput) => Evidence[]
}

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural} detected.`
}

const SECTION_CHECKS: SectionCheck[] = [
  {
    label: 'Name',
    weight: 15,
    present: ({ resume }) => Boolean(resume.contact.name),
    evidence: ({ resume }) => (resume.contact.name ? [explicitEvidence(resume.contact.name, 'contact')] : []),
  },
  {
    label: 'Contact info (email or phone)',
    weight: 15,
    present: ({ resume }) => Boolean(resume.contact.email || resume.contact.phone),
    evidence: ({ resume }) =>
      [resume.contact.email, resume.contact.phone].filter((v): v is string => Boolean(v)).map((v) => explicitEvidence(v, 'contact')),
  },
  {
    label: 'Summary',
    weight: 10,
    present: ({ resume }) => Boolean(resume.summary),
    evidence: ({ resume }) => (resume.summary ? [explicitEvidence(resume.summary, 'summary')] : []),
  },
  {
    label: 'Skills section',
    weight: 20,
    present: ({ resume }) => resume.skills.length > 0,
    evidence: ({ resume }) => [structuralEvidence(countLabel(resume.skills.length, 'skill', 'skills'), 'skills')],
  },
  {
    label: 'Experience section',
    weight: 30,
    present: ({ resume }) => resume.experience.length > 0,
    evidence: ({ resume }) => [structuralEvidence(countLabel(resume.experience.length, 'experience entry', 'experience entries'), 'experience')],
  },
  {
    label: 'Education section',
    weight: 10,
    present: ({ resume }) => resume.education.length > 0,
    evidence: ({ resume }) => [structuralEvidence(countLabel(resume.education.length, 'education entry', 'education entries'), 'education')],
  },
]

const TOTAL_WEIGHT = SECTION_CHECKS.reduce((sum, check) => sum + check.weight, 0)

/** The raw list of missing section/field labels — shared with the recommendation engine (TASK-011) so both agree on exactly what's missing. */
export function getMissingSections(input: AtsAnalysisInput): string[] {
  return SECTION_CHECKS.filter((check) => !check.present(input)).map((check) => check.label)
}

/**
 * Checks for the presence of the sections and contact fields a resume
 * needs to be screened at all. Weighted rather than a flat count —
 * missing "Experience" is a much bigger problem than missing "Summary".
 */
export function analyzeSections(input: AtsAnalysisInput): AnalyzerResult {
  const presentChecks = SECTION_CHECKS.filter((check) => check.present(input))
  const missing = getMissingSections(input)
  const earnedWeight = presentChecks.reduce((sum, check) => sum + check.weight, 0)

  const score = Math.round((earnedWeight / TOTAL_WEIGHT) * 100)

  return {
    score,
    strengths: presentChecks.map((check) => `${check.label} found.`),
    issues: missing.map((label) => `${label} not found.`),
    explanation:
      missing.length === 0
        ? 'All standard resume sections were found.'
        : `Missing: ${missing.join(', ')}.`,
    evidence: presentChecks.flatMap((check) => check.evidence(input)),
  }
}
