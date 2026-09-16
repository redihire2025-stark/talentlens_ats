import { normalizeSkillName } from '@/lib/normalization/skillDictionary'
import type { AnalyzerResult, AtsAnalysisInput } from './types'

/** A resume with this many distinct normalized skills or more earns full marks — see docs/scoring/scoring-methodology.md. */
const TARGET_DISTINCT_SKILLS = 8

/**
 * Without a job description, "keyword usage" can only measure how many
 * distinct, identifiable skill keywords the resume itself surfaces — not
 * whether they match anything specific. This is a self-contained richness
 * check, not a match; once a JD is provided, the matching engine (TASK-009)
 * does the real keyword-relevance comparison.
 */
export function analyzeKeywords({ resume }: AtsAnalysisInput): AnalyzerResult {
  const distinctSkills = new Set(resume.skills.map((skill) => normalizeSkillName(skill.name)))
  const count = distinctSkills.size
  const score = Math.round(Math.min(1, count / TARGET_DISTINCT_SKILLS) * 100)

  if (count === 0) {
    return {
      score: 0,
      strengths: [],
      issues: ['No identifiable skill keywords were found.'],
      explanation: 'No skills section or skill keywords were detected.',
    }
  }

  return {
    score,
    strengths: [`${count} distinct skill keyword${count === 1 ? '' : 's'} identified.`],
    issues: count < TARGET_DISTINCT_SKILLS ? [`Only ${count} distinct skill keywords found.`] : [],
    explanation: `${count} distinct skill keyword${count === 1 ? '' : 's'} found across the resume.`,
  }
}
