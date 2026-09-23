import type { ScoreResult } from '@/types/score'
import type { Evidence } from '@/types/evidence'
import { dedupeEvidence } from '@/lib/schema/evidence'
import { buildScoreComponent, totalWeightedScore } from '@/lib/scoring/scoreComponents'
import type { MatchAnalysis, MatchInput } from './types'
import { matchSkills } from './skillMatcher'
import { scoreEntries, scoreSingleResult } from './categoryScores'
import { JD_MATCH_SCORE_CATEGORIES, JD_MATCH_SCORE_WEIGHTS, type JdMatchScoreCategory } from './scoringConfig'

/** Evidence behind every matched/partial entry of a category (a missing entry has none, by definition). */
function evidenceOf(entries: { evidence: Evidence[] }[]): Evidence[] {
  return dedupeEvidence(entries.flatMap((entry) => entry.evidence))
}

/**
 * Combines the matching engine's per-category results (TASK-009) and the
 * resume's Resume Health / ATS Readiness score (TASK-008, computed
 * independently since it never depends on a JD) into the Job Match Score:
 * one `ScoreComponent` per category (raw 0-100 score, configured weight,
 * weighted contribution, explanation, supporting evidence), in
 * `JD_MATCH_SCORE_CATEGORIES` order. The overall score is exactly the
 * rounded sum of the weighted contributions. See
 * docs/scoring/scoring-methodology.md for the weight table and a note on
 * why `keywords` currently overlaps with required/preferred skills.
 */
export function calculateJdMatchScore(input: MatchInput, analysis: MatchAnalysis, atsCompatibilityScore: number): ScoreResult<JdMatchScoreCategory> {
  const keywordMatches = matchSkills(input.jobDescription.keywords, input.resume)
  const { skills, experience, responsibilities, title, education } = analysis

  const components: Record<JdMatchScoreCategory, { rawScore: number; explanation: string; evidence: Evidence[] }> = {
    requiredSkills: {
      rawScore: scoreEntries(skills.required),
      explanation: `Required skills: ${scoreEntries(skills.required)}% (${skills.required.filter((e) => e.status === 'matched').length} of ${skills.required.length} matched).`,
      evidence: evidenceOf(skills.required),
    },
    preferredSkills: {
      rawScore: scoreEntries(skills.preferred),
      explanation: `Preferred skills: ${scoreEntries(skills.preferred)}% (${skills.preferred.filter((e) => e.status === 'matched').length} of ${skills.preferred.length} matched).`,
      evidence: evidenceOf(skills.preferred),
    },
    experience: {
      rawScore: scoreSingleResult(experience),
      explanation: experience.explanation,
      evidence: experience.required ? experience.evidence : [],
    },
    responsibilities: {
      rawScore: scoreEntries(responsibilities),
      explanation: `Responsibilities: ${scoreEntries(responsibilities)}% aligned with resume experience.`,
      evidence: evidenceOf(responsibilities),
    },
    title: {
      rawScore: scoreSingleResult(title),
      explanation: title.explanation,
      evidence: title.evidence,
    },
    education: {
      rawScore: scoreSingleResult(education),
      explanation: education.required
        ? `Education: ${education.matchedRequirements.length} of ${education.matchedRequirements.length + education.missingRequirements.length} requirements met.`
        : 'No specific education requirement was stated.',
      evidence: evidenceOf(education.requirements),
    },
    keywords: {
      rawScore: scoreEntries(keywordMatches),
      explanation: `Keywords: ${scoreEntries(keywordMatches)}% of job description keywords found in the resume.`,
      evidence: evidenceOf(keywordMatches),
    },
    atsCompatibility: {
      rawScore: atsCompatibilityScore,
      explanation: `Resume Health: ${atsCompatibilityScore}/100 (see the Resume Health / ATS Readiness score for its own breakdown).`,
      evidence: [],
    },
  }

  const breakdown = JD_MATCH_SCORE_CATEGORIES.map((category) =>
    buildScoreComponent(category, components[category].rawScore, JD_MATCH_SCORE_WEIGHTS[category], components[category].explanation, components[category].evidence),
  )

  const allSkillEntries = [...skills.required, ...skills.preferred]

  return {
    score: totalWeightedScore(breakdown),
    breakdown,
    matched: allSkillEntries.filter((e) => e.status === 'matched').map((e) => e.normalizedTerm),
    missing: allSkillEntries.filter((e) => e.status === 'missing').map((e) => e.normalizedTerm),
    partial: allSkillEntries.filter((e) => e.status === 'partial').map((e) => e.normalizedTerm),
    explanations: breakdown.map((component) => component.explanation),
  }
}
