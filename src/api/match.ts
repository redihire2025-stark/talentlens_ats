import { matchResume } from '@/lib/matching/matchResume'
import { calculateJdMatchScore } from '@/lib/matching/calculateJdMatchScore'
import type { ApiResult, MatchRequest, MatchResponse } from './types'

/** POST /api/match */
export async function matchResumeToJob(request: MatchRequest): Promise<ApiResult<MatchResponse>> {
  if (!request?.resume || !request?.jobDescription) {
    return { ok: false, error: { code: 'INVALID_REQUEST', message: 'A resume and job description are both required.' } }
  }

  const input = { resume: request.resume, jobDescription: request.jobDescription }
  const analysis = matchResume(input)
  const result = calculateJdMatchScore(input, analysis, request.atsScore)

  return { ok: true, data: { analysis, result } }
}
