import { generateRecommendations } from '@/lib/recommendations/generateRecommendations'
import type { ApiResult, RecommendationsRequest, RecommendationsResponse } from './types'

/** POST /api/recommendations */
export async function getRecommendations(request: RecommendationsRequest): Promise<ApiResult<RecommendationsResponse>> {
  if (!request?.resume) {
    return { ok: false, error: { code: 'INVALID_REQUEST', message: 'A resume is required.' } }
  }

  const recommendations = generateRecommendations({
    resume: request.resume,
    parserWarnings: request.parserWarnings ?? [],
    matchAnalysis: request.matchAnalysis,
  })

  return { ok: true, data: { recommendations } }
}
