import { describe, expect, it } from 'vitest'
import { exportResume } from './resumeExport'
import { buildTestResume } from '@/lib/ats/testFixtures'

describe('exportResume', () => {
  it('produces a docx file with a filename derived from the candidate name', async () => {
    const result = await exportResume({ resume: buildTestResume({ candidate: { ...buildTestResume().candidate, name: 'Jordan Rivera' } }), format: 'docx' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.filename).toBe('jordan-rivera.docx')
      expect(result.data.blob.size).toBeGreaterThan(0)
    }
  })

  it('produces a pdf file', async () => {
    const result = await exportResume({ resume: buildTestResume(), format: 'pdf' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.filename.endsWith('.pdf')).toBe(true)
  })

  it('falls back to a generic filename when no name was parsed', async () => {
    const resume = buildTestResume({ candidate: { name: null, email: null, phone: null, location: null, links: [] } })
    const result = await exportResume({ resume, format: 'pdf' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.filename).toBe('resume.pdf')
  })

  it('rejects a request with no resume', async () => {
    // @ts-expect-error intentionally invalid request
    const result = await exportResume({ format: 'pdf' })
    expect(result.ok).toBe(false)
  })
})
