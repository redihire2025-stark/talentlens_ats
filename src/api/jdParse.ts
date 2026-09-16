import { parseJobDescriptionText } from '@/lib/parsers/jd/parseJobDescriptionText'
import type { ApiResult, ParseJobDescriptionResponse, ParseJobDescriptionTextRequest } from './types'

/**
 * POST /api/jd/parse — pasted text.
 *
 * Imports `parseJobDescriptionText` directly rather than through the `jd`
 * barrel: the barrel also re-exports the file-upload path, which pulls in
 * pdfjs-dist/mammoth. Pasting text is the common case and shouldn't pay
 * for that.
 */
export async function parseJobDescriptionFromText(
  request: ParseJobDescriptionTextRequest,
): Promise<ApiResult<ParseJobDescriptionResponse>> {
  if (!request?.text?.trim()) {
    return { ok: false, error: { code: 'INVALID_REQUEST', message: 'Job description text is required.' } }
  }

  const { jobDescription, warnings } = parseJobDescriptionText(request.text)
  return { ok: true, data: { jobDescription, warnings } }
}

/** POST /api/jd/parse — uploaded PDF/DOCX. Dynamically imported for the same reason as `parseResume`. */
export async function parseJobDescriptionFromFile(file: File): Promise<ApiResult<ParseJobDescriptionResponse>> {
  const { parseJobDescriptionFile, JobDescriptionParseError } = await import('@/lib/parsers/jd')

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
