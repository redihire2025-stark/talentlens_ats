import { describe, expect, it } from 'vitest'
import { hardRequirementRecommendations } from './hardRequirementRecommendations'
import { matchResume } from '@/lib/matching/matchResume'
import { buildTestMatchInput } from '@/lib/matching/testFixtures'

describe('hardRequirementRecommendations', () => {
  it('recommends against every unsatisfied hard requirement', () => {
    const analysis = matchResume(buildTestMatchInput())
    const recommendations = hardRequirementRecommendations(analysis)
    // Docker is a required skill with no evidence -> one hard-requirement-gap.
    expect(recommendations.some((r) => r.title.includes('Docker'))).toBe(true)
    expect(recommendations.every((r) => r.category === 'hard-requirement-gap')).toBe(true)
  })

  it('never recommends anything for a satisfied hard requirement', () => {
    const analysis = matchResume(buildTestMatchInput())
    const recommendations = hardRequirementRecommendations(analysis)
    expect(recommendations.some((r) => r.title.includes('React'))).toBe(false)
  })

  it('gives hard-requirement gaps the highest configured impact', () => {
    const analysis = matchResume(buildTestMatchInput())
    const recommendations = hardRequirementRecommendations(analysis)
    expect(recommendations[0]?.impact.delta).toBeGreaterThanOrEqual(8)
  })
})
