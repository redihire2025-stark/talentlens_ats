import { validateResumeFile, type ResumeSourceFormat } from './validateFile'
import { extractResumeText } from './extractText'
import { parseResumeText, type ParsedResumeResult } from './parseResumeText'

export class ResumeParseError extends Error {}

export interface ParseResumeFileResult extends ParsedResumeResult {
  sourceFormat: ResumeSourceFormat
}

/** Full pipeline: validate the uploaded file, extract its text, then parse that text into a Resume. */
export async function parseResumeFile(file: File): Promise<ParseResumeFileResult> {
  const validation = validateResumeFile(file)
  if (!validation.valid) {
    throw new ResumeParseError(validation.reason)
  }

  const rawText = await extractResumeText(file, validation.sourceFormat)
  const { resume, warnings } = parseResumeText(rawText, { sourceFormat: validation.sourceFormat })

  return { resume, warnings, sourceFormat: validation.sourceFormat }
}
