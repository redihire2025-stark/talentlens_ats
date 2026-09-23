import { describe, expect, it } from 'vitest'
import { responsibilityGapRecommendations } from './responsibilityGapRecommendations'
import { matchResume } from '@/lib/matching/matchResume'
import { buildTestMatchInput } from '@/lib/matching/testFixtures'

describe('responsibilityGapRecommendations', () => {
  it('flags a JD responsibility with no matching resume evidence', () => {
    const input = buildTestMatchInput({
      jobDescription: {
        ...buildTestMatchInput().jobDescription,
        responsibilities: ['Lead quarterly compliance audits for financial reporting systems.'],
      },
    })
    const analysis = matchResume(input)
    const recommendations = responsibilityGapRecommendations(analysis)
    expect(recommendations).toHaveLength(1)
    expect(recommendations[0].category).toBe('responsibility-gap')
    expect(recommendations[0].guidance).toContain("don't add")
  })

  it('does not flag a responsibility that is matched or partially matched', () => {
    const analysis = matchResume(buildTestMatchInput())
    // Default fixture's single responsibility ("Build reusable components for
    // production applications.") is directly evidenced by a resume bullet.
    expect(responsibilityGapRecommendations(analysis)).toHaveLength(0)
  })
})
