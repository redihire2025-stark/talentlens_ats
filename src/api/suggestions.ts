import { applyRecommendationAcceptance } from '@/lib/resume-generation/applyEdits'
import type { Recommendation, RecommendationStatus } from '@/lib/recommendations/types'
import type { Resume } from '@/types/resume'
import type { ApiResult } from './types'

export interface AcceptSuggestionRequest {
  resume: Resume
  recommendation: Recommendation
  /** The user's own replacement text, when they edited the suggestion before accepting. Omit to accept the recommendation's own suggestedText/suggestedChange as-is. */
  editedText?: string
}
export interface AcceptSuggestionResponse {
  resume: Resume
  status: RecommendationStatus
}

/**
 * POST /api/suggestions/:id/accept (PRD §19). Stateless by design, like
 * every other function in this folder: it takes the current resume and the
 * recommendation to accept, and returns the resulting resume plus the
 * status that recommendation should be recorded as — it does not track
 * per-id status itself (that's `editorStore`'s job on the client). Shares
 * its one rule for "what accepting means" with `editorStore` via
 * `applyRecommendationAcceptance` so the two can never disagree.
 */
export async function acceptSuggestion(request: AcceptSuggestionRequest): Promise<ApiResult<AcceptSuggestionResponse>> {
  if (!request?.resume || !request?.recommendation) {
    return { ok: false, error: { code: 'INVALID_REQUEST', message: 'A resume and recommendation are both required.' } }
  }

  const { resume, status } = applyRecommendationAcceptance(request.resume, request.recommendation, request.editedText)
  return { ok: true, data: { resume, status } }
}

export interface RejectSuggestionRequest {
  recommendationId: string
}
export interface RejectSuggestionResponse {
  recommendationId: string
  status: RecommendationStatus
}

/**
 * POST /api/suggestions/:id/reject (PRD §19). Rejecting never changes the
 * resume — it only records that the user declined the suggestion.
 */
export async function rejectSuggestion(request: RejectSuggestionRequest): Promise<ApiResult<RejectSuggestionResponse>> {
  if (!request?.recommendationId) {
    return { ok: false, error: { code: 'INVALID_REQUEST', message: 'A recommendationId is required.' } }
  }

  return { ok: true, data: { recommendationId: request.recommendationId, status: 'rejected' } }
}
