import { parseResumeFile, ResumeParseError } from '@/lib/parsers/resume'
import type { ApiResult, ParseResumeResponse } from './types'

/** POST /api/resume/parse */
export async function parseResume(file: File): Promise<ApiResult<ParseResumeResponse>> {
  try {
    const { resume, warnings } = await parseResumeFile(file)
    return { ok: true, data: { resume, warnings } }
  } catch (error) {
    if (error instanceof ResumeParseError) {
      return { ok: false, error: { code: 'RESUME_PARSE_FAILED', message: error.message } }
    }
    return { ok: false, error: { code: 'UNKNOWN_ERROR', message: 'Something went wrong while parsing the resume.' } }
  }
}
