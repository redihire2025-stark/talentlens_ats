import { describe, expect, it } from 'vitest'
import { skillGapRecommendations } from './skillGapRecommendations'
import { matchResume } from '@/lib/matching/matchResume'
import { buildTestMatchInput } from '@/lib/matching/testFixtures'

describe('skillGapRecommendations', () => {
  it('recommends documenting a genuinely missing required skill, and never implies simply adding it', () => {
    const analysis = matchResume(buildTestMatchInput())
    const recommendations = skillGapRecommendations(analysis)
    const docker = recommendations.find((r) => r.title.includes('docker'))
    expect(docker).toBeDefined()
    expect(docker?.guidance).toContain("please don't add it")
  })

  it('does not recommend anything for a fully matched skill', () => {
    const analysis = matchResume(buildTestMatchInput())
    const recommendations = skillGapRecommendations(analysis)
    expect(recommendations.some((r) => r.title.includes('react'))).toBe(false)
  })

  it('gives required skills more impact weight than preferred skills', () => {
    const analysis = matchResume(buildTestMatchInput())
    const docker = skillGapRecommendations(analysis).find((r) => r.title.includes('docker')) // required
    const graphql = skillGapRecommendations(analysis).find((r) => r.title.includes('graphql')) // preferred
    expect(docker!.impact.delta).toBeGreaterThan(graphql!.impact.delta)
  })
})
