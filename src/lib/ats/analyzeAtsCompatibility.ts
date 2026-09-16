import type { ScoreResult } from '@/types/score'
import type { AnalyzerResult, AtsAnalysisInput, AtsScoreBreakdown, AtsScoreCategory } from './types'
import { analyzeParsing } from './parsingAnalyzer'
import { analyzeSections } from './sectionAnalyzer'
import { analyzeKeywords } from './keywordAnalyzer'
import { analyzeExperienceStructure } from './experienceStructureAnalyzer'
import { analyzeSkillsEvidence } from './skillsEvidenceAnalyzer'
import { analyzeFormatting } from './formattingAnalyzer'
import { analyzeContentQuality } from './contentQualityAnalyzer'
import { calculateAtsScore } from './scoreCalculator'

const ANALYZERS: Record<AtsScoreCategory, (input: AtsAnalysisInput) => AnalyzerResult> = {
  parsing: analyzeParsing,
  sections: analyzeSections,
  keywords: analyzeKeywords,
  experience: analyzeExperienceStructure,
  skillsEvidence: analyzeSkillsEvidence,
  formatting: analyzeFormatting,
  contentQuality: analyzeContentQuality,
}

/**
 * Runs every ATS sub-analyzer over a resume and combines the results into
 * one explainable ATS Compatibility Score. This is the single entry point
 * the API layer (TASK-012) and UI (TASK-014) call — see
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
