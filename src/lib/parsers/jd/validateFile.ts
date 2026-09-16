import { validateDocumentFile, MAX_DOCUMENT_FILE_SIZE_BYTES, type DocumentSourceFormat } from '../shared/validateDocumentFile'

export const MAX_JD_FILE_SIZE_BYTES = MAX_DOCUMENT_FILE_SIZE_BYTES
export type JobDescriptionSourceFormat = DocumentSourceFormat

export type JobDescriptionFileValidation =
  | { valid: true; sourceFormat: JobDescriptionSourceFormat }
  | { valid: false; reason: string }

export function validateJobDescriptionFile(file: File): JobDescriptionFileValidation {
  return validateDocumentFile(file, { documentLabel: 'job description' })
}
