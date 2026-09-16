import { describe, expect, it } from 'vitest'
import { parseJobDescriptionFromFile, parseJobDescriptionFromText } from './jdParse'

function makeFile(name: string, type: string, sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], name, { type })
}

describe('parseJobDescriptionFromText', () => {
  it('parses valid job description text', async () => {
    const result = await parseJobDescriptionFromText({ text: 'Senior Engineer\n\nRequirements\nReact, TypeScript' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.jobDescription.requiredSkills).toEqual(['React', 'TypeScript'])
  })

  it('rejects empty text', async () => {
    const result = await parseJobDescriptionFromText({ text: '   ' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('INVALID_REQUEST')
  })
})

describe('parseJobDescriptionFromFile', () => {
  it('returns a structured error for an unsupported file type', async () => {
    const result = await parseJobDescriptionFromFile(makeFile('jd.txt', 'text/plain', 1024))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('JD_PARSE_FAILED')
  })
})
