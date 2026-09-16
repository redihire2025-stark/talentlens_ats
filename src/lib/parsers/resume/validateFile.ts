import { validateDocumentFile, MAX_DOCUMENT_FILE_SIZE_BYTES, type DocumentSourceFormat } from '../shared/validateDocumentFile'

export const MAX_RESUME_FILE_SIZE_BYTES = MAX_DOCUMENT_FILE_SIZE_BYTES
export type ResumeSourceFormat = DocumentSourceFormat

export type ResumeFileValidation =
  | { valid: true; sourceFormat: ResumeSourceFormat }
  | { valid: false; reason: string }

export function validateResumeFile(file: File): ResumeFileValidation {
  return validateDocumentFile(file, { documentLabel: 'resume' })
}
