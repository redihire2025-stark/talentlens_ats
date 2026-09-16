import { describe, expect, it } from 'vitest'
import { MAX_RESUME_FILE_SIZE_BYTES, validateResumeFile } from './validateFile'

function makeFile(name: string, type: string, sizeBytes: number): File {
  const content = sizeBytes > 0 ? new Uint8Array(sizeBytes) : new Uint8Array(0)
  return new File([content], name, { type })
}

describe('validateResumeFile', () => {
  it('accepts a PDF by MIME type', () => {
    const result = validateResumeFile(makeFile('resume.pdf', 'application/pdf', 1024))
    expect(result).toEqual({ valid: true, sourceFormat: 'pdf' })
  })

  it('accepts a DOCX by MIME type', () => {
    const result = validateResumeFile(
      makeFile('resume.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1024),
    )
    expect(result).toEqual({ valid: true, sourceFormat: 'docx' })
  })

  it('falls back to the file extension when the MIME type is missing', () => {
    const result = validateResumeFile(makeFile('resume.pdf', '', 1024))
    expect(result).toEqual({ valid: true, sourceFormat: 'pdf' })
  })

  it('rejects unsupported file types', () => {
    const result = validateResumeFile(makeFile('resume.txt', 'text/plain', 1024))
    expect(result.valid).toBe(false)
  })

  it('rejects an empty file', () => {
    const result = validateResumeFile(makeFile('resume.pdf', 'application/pdf', 0))
    expect(result.valid).toBe(false)
  })

  it('rejects a file larger than the configured maximum', () => {
    const result = validateResumeFile(makeFile('resume.pdf', 'application/pdf', MAX_RESUME_FILE_SIZE_BYTES + 1))
    expect(result.valid).toBe(false)
  })
})
