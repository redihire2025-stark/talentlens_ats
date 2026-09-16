import type { AnalyzerResult, AtsAnalysisInput } from './types'
import { isQuantified, startsWithActionVerb } from './bulletQuality'

/**
 * A proxy for how compelling the resume's content is, independent of any
 * job description: do bullets read as concrete accomplishments (start
 * with an action verb, include a quantifiable metric) rather than vague
 * duty statements, and is there a summary at all. This never rewrites or
 * scores against fabricated content — it only measures what's already
 * written (see the recommendation engine, TASK-011, for suggesting
 * improvements without inventing facts).
 */
export function analyzeContentQuality({ resume }: AtsAnalysisInput): AnalyzerResult {
  const bullets = resume.experience.flatMap((entry) => entry.bullets)

  if (bullets.length === 0) {
    return {
      score: resume.summary ? 30 : 0,
      strengths: resume.summary ? ['A professional summary is present.'] : [],
      issues: ['No experience bullet points were found to evaluate.'],
      explanation: 'Without bullet points, content quality (action verbs, quantified impact) cannot be assessed.',
    }
  }

  const actionVerbCount = bullets.filter(startsWithActionVerb).length
  const quantifiedCount = bullets.filter(isQuantified).length

  const actionVerbRatio = actionVerbCount / bullets.length
  const quantifiedRatio = quantifiedCount / bullets.length
  const summaryBonus = resume.summary ? 10 : 0

  const score = Math.round(Math.min(100, actionVerbRatio * 50 + quantifiedRatio * 40 + summaryBonus))

  const issues: string[] = []
  if (actionVerbRatio < 0.5) issues.push('Fewer than half of the bullet points start with a strong action verb.')
  if (quantifiedRatio < 0.3) issues.push('Fewer than a third of the bullet points include a measurable number or metric.')
  if (!resume.summary) issues.push('No professional summary was found.')

  return {
    score,
    strengths: [
      ...(actionVerbRatio >= 0.5 ? ['Most bullet points start with a strong action verb.'] : []),
      ...(quantifiedRatio >= 0.3 ? ['A good portion of bullet points include measurable impact.'] : []),
    ],
    issues,
    explanation: `${actionVerbCount} of ${bullets.length} bullets start with an action verb; ${quantifiedCount} of ${bullets.length} include a number or metric.`,
  }
}
