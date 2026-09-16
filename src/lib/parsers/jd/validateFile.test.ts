import { describe, expect, it } from 'vitest'
import { MAX_JD_FILE_SIZE_BYTES, validateJobDescriptionFile } from './validateFile'

function makeFile(name: string, type: string, sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], name, { type })
}

describe('validateJobDescriptionFile', () => {
  it('accepts a PDF or DOCX', () => {
    expect(validateJobDescriptionFile(makeFile('jd.pdf', 'application/pdf', 1024))).toEqual({
      valid: true,
      sourceFormat: 'pdf',
    })
  })

  it('rejects unsupported file types', () => {
    expect(validateJobDescriptionFile(makeFile('jd.txt', 'text/plain', 1024)).valid).toBe(false)
  })

  it('rejects a file larger than the configured maximum', () => {
    expect(
      validateJobDescriptionFile(makeFile('jd.pdf', 'application/pdf', MAX_JD_FILE_SIZE_BYTES + 1)).valid,
    ).toBe(false)
  })
})
