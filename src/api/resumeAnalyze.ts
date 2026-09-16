import { analyzeAtsCompatibility } from '@/lib/ats'
import type { AnalyzeResumeRequest, AnalyzeResumeResponse, ApiResult } from './types'

/** POST /api/resume/analyze */
export async function analyzeResume(request: AnalyzeResumeRequest): Promise<ApiResult<AnalyzeResumeResponse>> {
  if (!request?.resume) {
    return { ok: false, error: { code: 'INVALID_REQUEST', message: 'A resume is required.' } }
  }

  const result = analyzeAtsCompatibility({ resume: request.resume, parserWarnings: request.parserWarnings ?? [] })
  return { ok: true, data: { result } }
}
