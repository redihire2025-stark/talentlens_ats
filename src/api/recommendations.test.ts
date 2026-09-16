import { describe, expect, it } from 'vitest'
import { getRecommendations } from './recommendations'
import { buildTestResume } from '@/lib/ats/testFixtures'

describe('getRecommendations', () => {
  it('returns recommendations for a valid resume', async () => {
    const result = await getRecommendations({ resume: buildTestResume({ summary: null }) })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.recommendations.length).toBeGreaterThan(0)
  })

  it('rejects a request with no resume', async () => {
    // @ts-expect-error intentionally invalid request
    const result = await getRecommendations({})
    expect(result.ok).toBe(false)
  })
})
