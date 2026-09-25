import { validateResumeFile, type ResumeSourceFormat } from './validateFile'
import { extractResumeText } from './extractText'
import { parseResumeText, type ParsedResumeResult } from './parseResumeText'

export class ResumeParseError extends Error {}

export interface ParseResumeFileResult extends ParsedResumeResult {
  sourceFormat: ResumeSourceFormat
  /**
   * The extracted text the Resume was parsed from. Returned so the optional
   * AI-assisted parsing fallback (`src/lib/ai/aiAssistedParse.ts`, run by
   * `assistResumeParse` in src/api/resumeParse.ts) can work from the exact
   * same text and verify its output against it — it is only ever sent
   * anywhere for a resume whose deterministic parse raised a structural
   * warning.
   */
  rawText: string
}

/**
 * Full deterministic pipeline: validate the uploaded file, extract its
 * text, then parse that text into a Resume with the rule-based parser.
 * Always runs, unconditionally, for every upload; the AI-assisted fallback
 * is a separate, later step that can only fill fields this result flagged.
 */
export async function parseResumeFile(file: File): Promise<ParseResumeFileResult> {
  const validation = validateResumeFile(file)
  if (!validation.valid) {
    throw new ResumeParseError(validation.reason)
  }

  const rawText = await extractResumeText(file, validation.sourceFormat)
  const { resume, warnings } = parseResumeText(rawText, { sourceFormat: validation.sourceFormat })

  return { resume, warnings, sourceFormat: validation.sourceFormat, rawText }
}
