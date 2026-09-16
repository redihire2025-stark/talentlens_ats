import { validateJobDescriptionFile, type JobDescriptionSourceFormat } from './validateFile'
import { extractJobDescriptionText } from './extractText'
import { parseJobDescriptionText, type ParsedJobDescriptionResult } from './parseJobDescriptionText'

export class JobDescriptionParseError extends Error {}

export interface ParseJobDescriptionFileResult extends ParsedJobDescriptionResult {
  sourceFormat: JobDescriptionSourceFormat
}

/** Full pipeline for an uploaded JD file: validate, extract text, then parse — mirrors parseResumeFile. */
export async function parseJobDescriptionFile(file: File): Promise<ParseJobDescriptionFileResult> {
  const validation = validateJobDescriptionFile(file)
  if (!validation.valid) {
    throw new JobDescriptionParseError(validation.reason)
  }

  const rawText = await extractJobDescriptionText(file, validation.sourceFormat)
  const { jobDescription, warnings } = parseJobDescriptionText(rawText)

  return { jobDescription, warnings, sourceFormat: validation.sourceFormat }
}
