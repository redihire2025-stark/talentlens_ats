import type { ApiResult, ParseResumeResponse } from './types'

/**
 * POST /api/resume/parse
 *
 * Dynamically imports the resume parser rather than importing it at the
 * top of the module: it pulls in pdfjs-dist and mammoth, both sizeable
 * libraries that only need to load once the user actually uploads a file,
 * not on initial page load (see the PERFORMANCE section in AGENTS.md).
 */
export async function parseResume(file: File): Promise<ApiResult<ParseResumeResponse>> {
  const { parseResumeFile, ResumeParseError } = await import('@/lib/parsers/resume')

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
