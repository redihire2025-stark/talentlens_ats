import { describe, expect, it } from 'vitest'
import type { ScoreResult } from './score'

describe('ScoreResult', () => {
  it('matches the shared score envelope used by both ATS and JD match scores', () => {
    const atsScore = {
      score: 87,
      breakdown: { parsing: 96, sections: 100, keywords: 82 },
      matched: ['react', 'typescript'],
      missing: ['docker'],
      partial: ['graphql'],
      explanations: ['Keywords: 82% of expected terms present.'],
    } satisfies ScoreResult

    const jdMatchScore = {
      score: 84,
      breakdown: { requiredSkills: 92, preferredSkills: 71, experience: 96 },
      matched: ['react'],
      missing: ['docker'],
      partial: ['ci/cd'],
      explanations: ['Required skills: 5 of 6 demonstrated.'],
    } satisfies ScoreResult

    expect(atsScore.score).toBe(87)
    expect(jdMatchScore.matched).toContain('react')
    expect(atsScore.missing).toEqual(jdMatchScore.missing)
  })

  it('never invents a match status beyond matched/partial/missing', () => {
    const result = {
      score: 50,
      breakdown: {},
      matched: [],
      missing: [],
      partial: [],
      explanations: [],
    } satisfies ScoreResult

    for (const key of ['matched', 'missing', 'partial'] as const) {
      expect(Array.isArray(result[key])).toBe(true)
    }
  })
})
