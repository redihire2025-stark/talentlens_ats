import type { ScoreResult } from '@/types/score'
import type { MatchAnalysis, MatchInput } from './types'
import { matchSkills } from './skillMatcher'
import { scoreEntries, scoreSingleResult } from './categoryScores'
import { JD_MATCH_SCORE_CATEGORIES, JD_MATCH_SCORE_WEIGHTS, type JdMatchScoreBreakdown } from './scoringConfig'

function calculateWeightedScore(breakdown: JdMatchScoreBreakdown): number {
  const weightedSum = JD_MATCH_SCORE_CATEGORIES.reduce(
    (sum, category) => sum + breakdown[category] * JD_MATCH_SCORE_WEIGHTS[category],
    0,
  )
  return Math.round(Math.min(100, Math.max(0, weightedSum)))
}

/**
 * Combines the matching engine's per-category results (TASK-009) and the
 * resume's Resume Health / ATS Readiness score (TASK-008, computed
 * independently since it never depends on a JD) into the Job Match Score. See
 * docs/scoring/scoring-methodology.md for the weight table and a note on
 * why `keywords` currently overlaps with required/preferred skills.
 */
export function calculateJdMatchScore(
  input: MatchInput,
  analysis: MatchAnalysis,
  atsCompatibilityScore: number,
): ScoreResult<JdMatchScoreBreakdown> {
  const keywordMatches = matchSkills(input.jobDescription.keywords, input.resume)

  const breakdown: JdMatchScoreBreakdown = {
    requiredSkills: scoreEntries(analysis.skills.required),
    preferredSkills: scoreEntries(analysis.skills.preferred),
    experience: scoreSingleResult(analysis.experience),
    responsibilities: scoreEntries(analysis.responsibilities),
    title: scoreSingleResult(analysis.title),
    education: scoreSingleResult(analysis.education),
    keywords: scoreEntries(keywordMatches),
    atsCompatibility: atsCompatibilityScore,
  }

  const allSkillEntries = [...analysis.skills.required, ...analysis.skills.preferred]
  const matched = allSkillEntries.filter((e) => e.status === 'matched').map((e) => e.skill)
  const partial = allSkillEntries.filter((e) => e.status === 'partial').map((e) => e.skill)
  const missing = allSkillEntries.filter((e) => e.status === 'missing').map((e) => e.skill)

  const explanations = [
    `Required skills: ${breakdown.requiredSkills}% (${analysis.skills.required.filter((e) => e.status === 'matched').length} of ${analysis.skills.required.length} matched).`,
    `Preferred skills: ${breakdown.preferredSkills}% (${analysis.skills.preferred.filter((e) => e.status === 'matched').length} of ${analysis.skills.preferred.length} matched).`,
    analysis.experience.explanation,
    `Responsibilities: ${breakdown.responsibilities}% aligned with resume experience.`,
    analysis.title.explanation,
    analysis.education.required
      ? `Education: ${analysis.education.matchedRequirements.length} of ${analysis.education.matchedRequirements.length + analysis.education.missingRequirements.length} requirements met.`
      : 'No specific education requirement was stated.',
    `Keywords: ${breakdown.keywords}% of job description keywords found in the resume.`,
    `Resume Health: ${atsCompatibilityScore}/100 (see the Resume Health / ATS Readiness score for its own breakdown).`,
  ]

  return {
    score: calculateWeightedScore(breakdown),
    breakdown,
    matched,
    missing,
    partial,
    explanations,
  }
}
