import { describe, expect, it } from 'vitest'
import { calculateJdMatchScore } from './calculateJdMatchScore'
import { matchResume } from './matchResume'
import { buildTestMatchInput, buildTestJobDescription, buildTestResume } from './testFixtures'

describe('calculateJdMatchScore', () => {
  it('returns a full ScoreResult with every breakdown category populated', () => {
    const input = buildTestMatchInput()
    const analysis = matchResume(input)
    const result = calculateJdMatchScore(input, analysis, 85)

    expect(Object.keys(result.breakdown).sort()).toEqual(
      ['atsCompatibility', 'education', 'experience', 'keywords', 'preferredSkills', 'requiredSkills', 'responsibilities', 'title'].sort(),
    )
    expect(result.breakdown.atsCompatibility).toBe(85)
    expect(result.explanations).toHaveLength(8)
  })

  it('is deterministic for the same input', () => {
    const input = buildTestMatchInput()
    const analysis = matchResume(input)
    expect(calculateJdMatchScore(input, analysis, 85)).toEqual(calculateJdMatchScore(input, analysis, 85))
  })

  it('scores 100 when everything matches and the ATS score is perfect', () => {
    const input = buildTestMatchInput({
      jobDescription: buildTestJobDescription({
        requiredSkills: ['React', 'TypeScript'],
        preferredSkills: [],
        experience: { minimumYears: null, maximumYears: null },
        responsibilities: [],
        title: null,
        education: [],
        keywords: ['React', 'TypeScript'],
      }),
    })
    const analysis = matchResume(input)
    const result = calculateJdMatchScore(input, analysis, 100)
    expect(result.score).toBe(100)
  })

  it('scores low when nothing matches and the ATS score is poor', () => {
    const input = buildTestMatchInput({
      resume: buildTestResume({ skills: [], experience: [], education: [] }),
      jobDescription: buildTestJobDescription({
        requiredSkills: ['Docker', 'Kubernetes'],
        preferredSkills: ['Terraform'],
      }),
    })
    const analysis = matchResume(input)
    const result = calculateJdMatchScore(input, analysis, 10)
    expect(result.score).toBeLessThan(30)
  })

  it('separates matched, partial, and missing skills across required and preferred', () => {
    const input = buildTestMatchInput()
    const analysis = matchResume(input)
    const result = calculateJdMatchScore(input, analysis, 85)
    expect(result.matched).toContain('react')
    expect(result.missing).toContain('docker')
  })
})
