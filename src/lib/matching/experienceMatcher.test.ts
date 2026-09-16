import { describe, expect, it } from 'vitest'
import { calculateYearsOfExperience, matchExperience } from './experienceMatcher'
import { buildTestMatchInput, buildTestJobDescription, buildTestResume } from './testFixtures'

describe('calculateYearsOfExperience', () => {
  it('returns 0 for no experience', () => {
    expect(calculateYearsOfExperience(buildTestResume({ experience: [] }))).toBe(0)
  })

  it('computes the calendar span from earliest start to latest end/now', () => {
    const resume = buildTestResume({
      experience: [
        { company: 'A', title: 'Engineer', startDate: '2020-01-01', endDate: '2022-01-01', location: null, bullets: [] },
      ],
    })
    expect(calculateYearsOfExperience(resume)).toBeCloseTo(2, 1)
  })

  it('does not double-count overlapping roles', () => {
    const resume = buildTestResume({
      experience: [
        { company: 'A', title: 'Engineer', startDate: '2020-01-01', endDate: '2021-01-01', location: null, bullets: [] },
        { company: 'B', title: 'Consultant', startDate: '2020-06-01', endDate: '2021-06-01', location: null, bullets: [] },
      ],
    })
    // Span from 2020-01-01 to 2021-06-01 is ~17 months (~1.42 years), not the 1+1=2 years summing each entry would give.
    const years = calculateYearsOfExperience(resume)
    expect(years).toBeGreaterThan(1.3)
    expect(years).toBeLessThan(1.6)
  })
})

describe('matchExperience', () => {
  it('matches when the candidate meets the minimum', () => {
    const result = matchExperience(
      buildTestMatchInput({ jobDescription: buildTestJobDescription({ experience: { minimumYears: 3, maximumYears: null } }) }),
    )
    expect(result.status).toBe('matched')
  })

  it('is not required when the JD states no experience requirement', () => {
    const result = matchExperience(
      buildTestMatchInput({ jobDescription: buildTestJobDescription({ experience: { minimumYears: null, maximumYears: null } }) }),
    )
    expect(result.required).toBe(false)
    expect(result.status).toBe('matched')
  })

  it('reports partial when close to, but under, the minimum', () => {
    const resume = buildTestResume({
      experience: [{ company: 'A', title: 'Engineer', startDate: '2020-01-01', endDate: '2024-06-01', location: null, bullets: [] }],
    })
    const result = matchExperience(
      buildTestMatchInput({ resume, jobDescription: buildTestJobDescription({ experience: { minimumYears: 5, maximumYears: null } }) }),
    )
    expect(result.status).toBe('partial')
  })

  it('reports missing, never fabricating experience, when far short of the minimum', () => {
    const resume = buildTestResume({ experience: [] })
    const result = matchExperience(
      buildTestMatchInput({ resume, jobDescription: buildTestJobDescription({ experience: { minimumYears: 5, maximumYears: null } }) }),
    )
    expect(result.status).toBe('missing')
    expect(result.candidateYears).toBeNull()
  })
})
