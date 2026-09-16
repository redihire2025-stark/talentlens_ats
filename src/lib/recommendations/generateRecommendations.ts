import { bulletImpactRecommendations } from './bulletImpactRecommendations'
import { missingSectionRecommendations } from './missingSectionRecommendations'
import { skillEvidenceRecommendations } from './skillEvidenceRecommendations'
import { formattingRecommendations } from './formattingRecommendations'
import { skillGapRecommendations } from './skillGapRecommendations'
import { titleAlignmentRecommendations } from './titleAlignmentRecommendations'
import type { GenerateRecommendationsInput, Recommendation } from './types'

/**
 * Runs every recommendation generator and returns the combined list.
 * Resume-only generators always run; JD-dependent ones (skill gaps, title
 * alignment) only run when a job description was analyzed. Every
 * recommendation traces back to real resume/JD content — none is
 * generated from a fabricated fact (see docs/product/v1-scope.md).
 */
export function generateRecommendations({ resume, parserWarnings, matchAnalysis }: GenerateRecommendationsInput): Recommendation[] {
  const recommendations: Recommendation[] = [
    ...bulletImpactRecommendations(resume),
    ...missingSectionRecommendations({ resume, parserWarnings }),
    ...skillEvidenceRecommendations(resume),
    ...formattingRecommendations(resume),
  ]

  if (matchAnalysis) {
    recommendations.push(...skillGapRecommendations(matchAnalysis), ...titleAlignmentRecommendations(matchAnalysis))
  }

  return recommendations
}
