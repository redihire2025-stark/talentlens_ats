import { describe, expect, it } from 'vitest'
import { buildResumeDocx } from './exportDocx'
import { buildTestResume } from '@/lib/ats/testFixtures'

describe('buildResumeDocx', () => {
  it('produces a non-empty DOCX blob with the correct MIME type', async () => {
    const blob = await buildResumeDocx(buildTestResume())
    expect(blob.size).toBeGreaterThan(0)
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
  })

  it('does not throw for a resume with empty optional sections', async () => {
    const resume = buildTestResume({ certifications: [], projects: [], education: [] })
    await expect(buildResumeDocx(resume)).resolves.toBeInstanceOf(Blob)
  })
})
