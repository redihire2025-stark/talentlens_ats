import { parseJobDescriptionFile, parseJobDescriptionText, JobDescriptionParseError } from '@/lib/parsers/jd'
import type { ApiResult, ParseJobDescriptionResponse, ParseJobDescriptionTextRequest } from './types'

/** POST /api/jd/parse — pasted text. */
export async function parseJobDescriptionFromText(
  request: ParseJobDescriptionTextRequest,
): Promise<ApiResult<ParseJobDescriptionResponse>> {
  if (!request?.text?.trim()) {
    return { ok: false, error: { code: 'INVALID_REQUEST', message: 'Job description text is required.' } }
  }

  const { jobDescription, warnings } = parseJobDescriptionText(request.text)
  return { ok: true, data: { jobDescription, warnings } }
}

/** POST /api/jd/parse — uploaded PDF/DOCX. */
export async function parseJobDescriptionFromFile(file: File): Promise<ApiResult<ParseJobDescriptionResponse>> {
  try {
    const { jobDescription, warnings } = await parseJobDescriptionFile(file)
    return { ok: true, data: { jobDescription, warnings } }
  } catch (error) {
    if (error instanceof JobDescriptionParseError) {
      return { ok: false, error: { code: 'JD_PARSE_FAILED', message: error.message } }
    }
    return { ok: false, error: { code: 'UNKNOWN_ERROR', message: 'Something went wrong while parsing the job description.' } }
  }
}
