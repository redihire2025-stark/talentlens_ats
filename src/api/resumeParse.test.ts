import { describe, expect, it } from 'vitest'
import { parseResume } from './resumeParse'

function makeFile(name: string, type: string, sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], name, { type })
}

describe('parseResume', () => {
  it('returns a structured error for an unsupported file type, without throwing', async () => {
    const result = await parseResume(makeFile('resume.txt', 'text/plain', 1024))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('RESUME_PARSE_FAILED')
  })

  it('returns a structured error for an empty file', async () => {
    const result = await parseResume(makeFile('resume.pdf', 'application/pdf', 0))
    expect(result.ok).toBe(false)
  })
})
