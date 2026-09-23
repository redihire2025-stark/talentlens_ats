import type { ScoreResult } from '@/types/score'
import { buildScoreComponent, totalWeightedScore } from '@/lib/scoring/scoreComponents'
import { ATS_SCORE_WEIGHTS } from './scoringConfig'
import { ATS_SCORE_CATEGORIES, type AnalyzerResult, type AtsAnalysisInput, type AtsScoreBreakdown, type AtsScoreCategory } from './types'
import { analyzeParsing } from './parsingAnalyzer'
import { analyzeSections } from './sectionAnalyzer'
import { analyzeKeywords } from './keywordAnalyzer'
import { analyzeExperienceStructure } from './experienceStructureAnalyzer'
import { analyzeSkillsEvidence } from './skillsEvidenceAnalyzer'
import { analyzeFormatting } from './formattingAnalyzer'
import { analyzeContentQuality } from './contentQualityAnalyzer'
import { analyzeRiskConsistency } from './riskConsistencyAnalyzer'

/**
 * `skillsEvidence` combines two signals into one PRD §11 "Skills &
 * Evidence" category: whether listed skills are backed up by a bullet
 * (`analyzeSkillsEvidence`), and how many distinct skill keywords the
 * resume surfaces at all (`analyzeKeywords`, formerly its own top-level
 * category — see docs/scoring/scoring-methodology.md). Averaging keeps
 * either signal from being ignored while still producing one explainable
 * sub-score.
 */
function analyzeSkillsAndEvidence(input: AtsAnalysisInput): AnalyzerResult {
  const evidence = analyzeSkillsEvidence(input)
  const keywords = analyzeKeywords(input)
  return {
    score: Math.round((evidence.score + keywords.score) / 2),
    strengths: [...evidence.strengths, ...keywords.strengths],
    issues: [...evidence.issues, ...keywords.issues],
    explanation: `${evidence.explanation} ${keywords.explanation}`,
    evidence: [...(evidence.evidence ?? []), ...(keywords.evidence ?? [])],
  }
}

const ANALYZERS: Record<AtsScoreCategory, (input: AtsAnalysisInput) => AnalyzerResult> = {
  atsEssentials: analyzeParsing,
  resumeStructure: analyzeSections,
  contentQuality: analyzeContentQuality,
  skillsEvidence: analyzeSkillsAndEvidence,
  experienceSeniority: analyzeExperienceStructure,
  recruiterReadability: analyzeFormatting,
  riskConsistency: analyzeRiskConsistency,
}

/**
 * Runs every Resume Health / ATS Readiness sub-analyzer (PRD §11) over a
 * resume and combines the results into one explainable score: one
 * `ScoreComponent` per category (raw score, configured weight, weighted
 * contribution, explanation, evidence), in `ATS_SCORE_CATEGORIES` order,
 * and an overall score that is exactly the rounded sum of the weighted
 * contributions. This is the single entry point the API layer and UI call —
 * see docs/scoring/scoring-methodology.md for what each category measures.
 */
export function analyzeAtsCompatibility(input: AtsAnalysisInput): ScoreResult<AtsScoreCategory> {
  const breakdown: AtsScoreBreakdown = []
  const matched: string[] = []
  const missing: string[] = []
  const explanations: string[] = []

  for (const category of ATS_SCORE_CATEGORIES) {
    const result = ANALYZERS[category](input)
    breakdown.push(buildScoreComponent(category, result.score, ATS_SCORE_WEIGHTS[category], result.explanation, result.evidence ?? []))
    matched.push(...result.strengths)
    missing.push(...result.issues)
    explanations.push(result.explanation)
  }

  return {
    score: totalWeightedScore(breakdown),
    breakdown,
    matched,
    missing,
    partial: [],
    explanations,
  }
}
