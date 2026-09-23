import { describe, expect, it } from 'vitest'
import { experienceGapRecommendations } from './experienceGapRecommendations'
import { matchResume } from '@/lib/matching/matchResume'
import { buildTestMatchInput, buildTestResume, buildTestJobDescription } from '@/lib/matching/testFixtures'
import { buildExperienceEntries } from '@/lib/schema/resumeBuilders'

describe('experienceGapRecommendations', () => {
  it('flags a gap when the resume shows fewer years than the JD requires', () => {
    const resume = buildTestResume({
      experience: buildExperienceEntries([
        {
          company: 'Acme Corp',
          title: 'Frontend Engineer',
          startDate: '2023-01-01',
          endDate: null,
          location: 'Remote',
          bullets: ['Built React components.'],
        },
      ]),
    })
    const input = buildTestMatchInput({ resume })
    const analysis = matchResume(input)
    const recommendations = experienceGapRecommendations(analysis)
    expect(recommendations).toHaveLength(1)
    expect(recommendations[0].category).toBe('experience-gap')
    expect(recommendations[0].guidance).toContain('genuine additional experience')
  })

  it('does not flag anything when experience meets the requirement', () => {
    const analysis = matchResume(buildTestMatchInput())
    expect(experienceGapRecommendations(analysis)).toHaveLength(0)
  })

  it('does not flag anything when the JD states no experience requirement', () => {
    const input = buildTestMatchInput({
      jobDescription: buildTestJobDescription({ experience: { minimumYears: null, maximumYears: null } }),
    })
    const analysis = matchResume(input)
    expect(experienceGapRecommendations(analysis)).toHaveLength(0)
  })
})
