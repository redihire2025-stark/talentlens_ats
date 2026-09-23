import { matchResume } from '@/lib/matching/matchResume'
import { calculateJdMatchScore } from '@/lib/matching/calculateJdMatchScore'
import { generateRecommendations } from '@/lib/recommendations/generateRecommendations'
import type { MatchAnalysis } from '@/lib/matching/types'
import type { JdMatchScoreCategory } from '@/lib/matching/scoringConfig'
import type { Recommendation } from '@/lib/recommendations/types'
import type { ScoreResult } from '@/types/score'
import type { Resume } from '@/types/resume'
import type { JobDescription } from '@/types/jobDescription'
import type { ApiResult } from './types'

export interface TailorResumeRequest {
  resume: Resume
  jobDescription: JobDescription
  /** The resume's Resume Health / ATS Readiness score — same convention as `/api/match` (`MatchRequest.atsScore`). */
  atsScore: number
  parserWarnings?: string[]
}
export interface TailorResumeResponse {
  analysis: MatchAnalysis
  matchResult: ScoreResult<JdMatchScoreCategory>
  /** Every deterministic + AI-assistable recommendation for closing the gap to this specific job — resume-wide checks and JD-specific gaps together, exactly what the "Tailor Resume" screen (PRD §22) needs in one call. */
  recommendations: Recommendation[]
}

/**
 * POST /api/resumes/:id/tailor (PRD §19/§22). This is deliberately not a
 * new capability: it's the existing match + recommendation engines run
 * together for one job description, returned as one response so the
 * "Tailor Resume" screen doesn't need two round trips. It never rewrites
 * the resume itself — accepting a suggestion (`/api/suggestions/:id/accept`)
 * is a separate, explicit step, same as everywhere else in this app (PRD
 * §3: "never silently modify a user's resume").
 */
export async function tailorResume(request: TailorResumeRequest): Promise<ApiResult<TailorResumeResponse>> {
  if (!request?.resume || !request?.jobDescription) {
    return { ok: false, error: { code: 'INVALID_REQUEST', message: 'A resume and job description are both required.' } }
  }

  const input = { resume: request.resume, jobDescription: request.jobDescription }
  const analysis = matchResume(input)
  const matchResult = calculateJdMatchScore(input, analysis, request.atsScore)
  const recommendations = generateRecommendations({
    resume: request.resume,
    parserWarnings: request.parserWarnings ?? [],
    matchAnalysis: analysis,
  })

  return { ok: true, data: { analysis, matchResult, recommendations } }
}
