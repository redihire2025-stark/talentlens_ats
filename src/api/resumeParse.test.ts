import { describe, expect, it, vi } from 'vitest'
import { assistResumeParse, parseResume } from './resumeParse'
import { parseResumeText } from '@/lib/parsers/resume/parseResumeText'

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

describe('assistResumeParse', () => {
  it('makes no network call and returns the same Resume when the deterministic parse was clean', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const { resume } = parseResumeText(`Jordan Rivera
Austin, TX
jordan.rivera@example.com | 555-010-1234

Skills
JavaScript, TypeScript, React

Work Experience
Frontend Engineer, Acme Corp | Remote | Mar 2021 - Present
- Built reusable React components used across 4 production applications.
`)
    expect(resume.parserWarnings).toEqual([])

    const result = await assistResumeParse({ resume, rawText: 'irrelevant' })
    expect(result).toEqual({ ok: true, data: { resume, status: 'not-needed', filledFields: [] } })
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('is always ok:true — an unreachable AI service is a silent fallback, never an upload error', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
    const text = `Dana Okafor
Experience
Staff Software Engineer Globex Corporation Mar 2019 - Present
- Led the migration of 40 services to Kubernetes.
`
    const { resume } = parseResumeText(text)
    const result = await assistResumeParse({ resume, rawText: text })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.status).toBe('failed')
      expect(result.data.resume).toBe(resume)
    }
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    fetchSpy.mockRestore()
  })
})
