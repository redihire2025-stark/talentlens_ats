import { describe, expect, it } from 'vitest'
import { tailorResume } from './tailor'
import { buildTestResume, buildTestJobDescription } from '@/lib/matching/testFixtures'
import { getScoreComponent } from '@/lib/scoring/scoreComponents'

describe('tailorResume', () => {
  it('returns a match analysis, JD match result, and recommendations together', async () => {
    const result = await tailorResume({ resume: buildTestResume(), jobDescription: buildTestJobDescription(), atsScore: 80 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.analysis.skills.required.length).toBeGreaterThan(0)
    expect(getScoreComponent(result.data.matchResult.breakdown, 'atsCompatibility')?.rawScore).toBe(80)
    expect(result.data.recommendations.some((r) => r.category === 'skill-not-demonstrated')).toBe(true)
  })

  it('rejects a request missing the job description', async () => {
    // @ts-expect-error intentionally invalid request
    const result = await tailorResume({ resume: buildTestResume(), atsScore: 80 })
    expect(result.ok).toBe(false)
  })
})
