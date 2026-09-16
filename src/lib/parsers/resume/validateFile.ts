export const MAX_RESUME_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

const MIME_TO_FORMAT = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
} as const

export type ResumeSourceFormat = (typeof MIME_TO_FORMAT)[keyof typeof MIME_TO_FORMAT]

export type ResumeFileValidation =
  | { valid: true; sourceFormat: ResumeSourceFormat }
  | { valid: false; reason: string }

/**
 * Detects the source format from MIME type first, falling back to the file
 * extension — browsers sometimes report an empty or generic MIME type for
 * drag-and-drop uploads.
 */
function detectSourceFormat(file: File): ResumeSourceFormat | null {
  const byMime = MIME_TO_FORMAT[file.type as keyof typeof MIME_TO_FORMAT]
  if (byMime) return byMime

  const extension = file.name.toLowerCase().split('.').pop()
  if (extension === 'pdf') return 'pdf'
  if (extension === 'docx') return 'docx'
  return null
}

export function validateResumeFile(file: File): ResumeFileValidation {
  const sourceFormat = detectSourceFormat(file)
  if (!sourceFormat) {
    return { valid: false, reason: 'Unsupported file type. Upload a resume as a PDF or DOCX file.' }
  }
  if (file.size === 0) {
    return { valid: false, reason: 'This file is empty.' }
  }
  if (file.size > MAX_RESUME_FILE_SIZE_BYTES) {
    const maxMb = MAX_RESUME_FILE_SIZE_BYTES / (1024 * 1024)
    return { valid: false, reason: `This file is too large. The maximum size is ${maxMb}MB.` }
  }
  return { valid: true, sourceFormat }
}
