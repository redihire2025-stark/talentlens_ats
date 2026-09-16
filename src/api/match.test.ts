import { describe, expect, it } from 'vitest'
import { matchResumeToJob } from './match'
import { buildTestResume, buildTestJobDescription } from '@/lib/matching/testFixtures'

describe('matchResumeToJob', () => {
  it('returns a match analysis and score for a valid request', async () => {
    const result = await matchResumeToJob({ resume: buildTestResume(), jobDescription: buildTestJobDescription(), atsScore: 85 })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.result.breakdown.atsCompatibility).toBe(85)
      expect(result.data.analysis.skills.required.length).toBeGreaterThan(0)
    }
  })

  it('rejects a request missing the job description', async () => {
    // @ts-expect-error intentionally invalid request
    const result = await matchResumeToJob({ resume: buildTestResume(), atsScore: 85 })
    expect(result.ok).toBe(false)
  })
})
