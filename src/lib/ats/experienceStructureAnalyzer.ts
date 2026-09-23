import type { AnalyzerResult, AtsAnalysisInput } from './types'
import type { Evidence } from '@/types/evidence'

/**
 * Checks the structural quality of the experience section — not whether it
 * matches any job description (that's the matching engine's job, TASK-009)
 * — but whether each entry has the fields a screener or ATS needs: a
 * title, a company, dates, and at least one bullet.
 */
export function analyzeExperienceStructure({ resume }: AtsAnalysisInput): AnalyzerResult {
  const { experience } = resume

  if (experience.length === 0) {
    return {
      score: 0,
      strengths: [],
      issues: ['No work experience entries were found.'],
      explanation: 'No experience section was detected.',
    }
  }

  let wellStructuredCount = 0
  const issues: string[] = []
  const evidence: Evidence[] = []

  experience.forEach((entry, index) => {
    const problems: string[] = []
    if (!entry.title) problems.push('missing title')
    if (!entry.company) problems.push('missing company')
    if (!entry.startDate) problems.push('missing start date')
    if (entry.bullets.length === 0) problems.push('no bullet points')

    if (problems.length === 0) {
      wellStructuredCount += 1
      evidence.push(...entry.evidence)
    } else {
      issues.push(`Experience entry ${index + 1}: ${problems.join(', ')}.`)
    }
  })

  const score = Math.round((wellStructuredCount / experience.length) * 100)

  return {
    score,
    strengths:
      wellStructuredCount > 0
        ? [`${wellStructuredCount} of ${experience.length} experience entries are fully structured.`]
        : [],
    issues,
    explanation:
      issues.length === 0
        ? 'All experience entries have a title, company, dates, and bullet points.'
        : `${issues.length} of ${experience.length} experience entries are missing structural details.`,
    // The meta line(s) of each fully-structured entry.
    evidence,
  }
}
