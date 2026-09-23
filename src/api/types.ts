import type { Resume } from '@/types/resume'
import type { JobDescription } from '@/types/jobDescription'
import type { ScoreResult } from '@/types/score'
import type { AtsScoreCategory } from '@/lib/ats/types'
import type { MatchAnalysis } from '@/lib/matching/types'
import type { JdMatchScoreCategory } from '@/lib/matching/scoringConfig'
import type { Recommendation } from '@/lib/recommendations/types'

export interface ApiError {
  code: string
  message: string
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError }

export interface ParseResumeResponse {
  resume: Resume
  warnings: string[]
}

export interface AnalyzeResumeRequest {
  resume: Resume
  parserWarnings?: string[]
}
export interface AnalyzeResumeResponse {
  result: ScoreResult<AtsScoreCategory>
}

export interface ParseJobDescriptionTextRequest {
  text: string
}
export interface ParseJobDescriptionResponse {
  jobDescription: JobDescription
  warnings: string[]
}

export interface MatchRequest {
  resume: Resume
  jobDescription: JobDescription
  /** The resume's Resume Health / ATS Readiness score — computed separately (it never depends on the JD) and passed in rather than recomputed here. */
  atsScore: number
}
export interface MatchResponse {
  analysis: MatchAnalysis
  result: ScoreResult<JdMatchScoreCategory>
}

export interface RecommendationsRequest {
  resume: Resume
  parserWarnings?: string[]
  matchAnalysis?: MatchAnalysis
}
export interface RecommendationsResponse {
  recommendations: Recommendation[]
}

export interface HealthResponse {
  status: 'ok'
}
