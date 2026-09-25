import type { ApiResult, AssistResumeParseRequest, AssistResumeParseResponse, ParseResumeResponse } from './types'

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
    const { resume, warnings, rawText } = await parseResumeFile(file)
    return { ok: true, data: { resume, warnings, rawText } }
  } catch (error) {
    if (error instanceof ResumeParseError) {
      return { ok: false, error: { code: 'RESUME_PARSE_FAILED', message: error.message } }
    }
    return { ok: false, error: { code: 'UNKNOWN_ERROR', message: 'Something went wrong while parsing the resume.' } }
  }
}

/**
 * POST /api/resume/parse/assist — the AI-assisted parsing FALLBACK.
 *
 * Takes the deterministic parse from `parseResume` and, only if its parser
 * warnings name a structural problem (title/company not separated, no
 * skills section, no experience, no email/phone), asks the server-side
 * parse-resume-ai function for an extraction, drops every value that
 * doesn't appear verbatim in the resume text, and fills only those flagged,
 * still-empty fields. A clean parse returns immediately with no network
 * call. Always `ok: true`: any AI failure is a silent fallback to the
 * deterministic Resume, never an error that blocks the upload. See
 * docs/architecture/resume-parser.md's "AI-assisted parsing fallback".
 *
 * Dynamically imported for the same reason as the parser: nothing AI-related
 * needs to load until a resume actually needs it.
 */
export async function assistResumeParse({ resume, rawText }: AssistResumeParseRequest): Promise<ApiResult<AssistResumeParseResponse>> {
  try {
    const { assistParseWithAi } = await import('@/lib/ai/aiAssistedParse')
    const outcome = await assistParseWithAi(resume, rawText)
    return { ok: true, data: outcome }
  } catch {
    return { ok: true, data: { resume, status: 'failed', filledFields: [] } }
  }
}
