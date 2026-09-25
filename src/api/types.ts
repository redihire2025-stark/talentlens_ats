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
  /** The extracted text `resume` was parsed from — kept client-side only, for the AI-assisted parsing fallback (see `AssistResumeParseRequest`). */
  rawText: string
}

export interface AssistResumeParseRequest {
  /** The deterministic parser's Resume. */
  resume: Resume
  /** The same extracted text it was parsed from. */
  rawText: string
}

export interface AssistResumeParseResponse {
  /** The deterministic Resume, with only its warning-flagged, empty fields filled from verified AI output — or the deterministic Resume unchanged. */
  resume: Resume
  /** See `AiAssistStatus` in src/lib/ai/aiAssistedParse.ts. `not-needed` means no network call was made. */
  status: 'not-needed' | 'skipped' | 'failed' | 'no-change' | 'applied'
  filledFields: string[]
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
