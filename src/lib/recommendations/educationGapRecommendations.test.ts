import { describe, expect, it } from 'vitest'
import { educationGapRecommendations } from './educationGapRecommendations'
import { matchResume } from '@/lib/matching/matchResume'
import { buildTestMatchInput, buildTestResume } from '@/lib/matching/testFixtures'

describe('educationGapRecommendations', () => {
  it('flags an education requirement the resume does not satisfy', () => {
    const resume = buildTestResume({ education: [] })
    const input = buildTestMatchInput({
      resume,
      jobDescription: { ...buildTestMatchInput().jobDescription, education: ["Master's degree in Computer Science"] },
    })
    const analysis = matchResume(input)
    const recommendations = educationGapRecommendations(analysis)
    expect(recommendations).toHaveLength(1)
    expect(recommendations[0].category).toBe('education-gap')
    expect(recommendations[0].guidance).toContain('never claim a credential')
  })

  it('does not flag anything when education is fully matched', () => {
    const analysis = matchResume(buildTestMatchInput())
    expect(educationGapRecommendations(analysis)).toHaveLength(0)
  })

  it('does not flag anything when the JD states no education requirement', () => {
    const input = buildTestMatchInput({ jobDescription: { ...buildTestMatchInput().jobDescription, education: [] } })
    const analysis = matchResume(input)
    expect(educationGapRecommendations(analysis)).toHaveLength(0)
  })
})
