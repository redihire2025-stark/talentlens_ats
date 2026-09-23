import type { ScoreResult } from '@/types/score'
import type { AnalyzerResult, AtsAnalysisInput, AtsScoreBreakdown, AtsScoreCategory } from './types'
import { analyzeParsing } from './parsingAnalyzer'
import { analyzeSections } from './sectionAnalyzer'
import { analyzeKeywords } from './keywordAnalyzer'
import { analyzeExperienceStructure } from './experienceStructureAnalyzer'
import { analyzeSkillsEvidence } from './skillsEvidenceAnalyzer'
import { analyzeFormatting } from './formattingAnalyzer'
import { analyzeContentQuality } from './contentQualityAnalyzer'
import { analyzeRiskConsistency } from './riskConsistencyAnalyzer'
import { calculateAtsScore } from './scoreCalculator'

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
 * resume and combines the results into one explainable score. This is the
 * single entry point the API layer and UI call — see
 * docs/scoring/scoring-methodology.md for what each category measures.
 */
export function analyzeAtsCompatibility(input: AtsAnalysisInput): ScoreResult<AtsScoreBreakdown> {
  const breakdown = {} as AtsScoreBreakdown
  const matched: string[] = []
  const missing: string[] = []
  const explanations: string[] = []

  for (const [category, analyze] of Object.entries(ANALYZERS) as [AtsScoreCategory, (input: AtsAnalysisInput) => AnalyzerResult][]) {
    const result = analyze(input)
    breakdown[category] = result.score
    matched.push(...result.strengths)
    missing.push(...result.issues)
    explanations.push(result.explanation)
  }

  return {
    score: calculateAtsScore(breakdown),
    breakdown,
    matched,
    missing,
    partial: [],
    explanations,
  }
}
