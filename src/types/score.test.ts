import { describe, expect, it } from 'vitest'
import type { ScoreResult } from './score'
import { buildScoreComponent, getScoreComponent, rawScoresByCategory, totalWeightedScore } from '@/lib/scoring/scoreComponents'

describe('ScoreResult', () => {
  it('matches the shared score envelope used by both ATS and JD match scores', () => {
    const atsScore = {
      score: 87,
      breakdown: [
        buildScoreComponent('parsing', 96, 0.4, 'Parsed cleanly.'),
        buildScoreComponent('sections', 100, 0.3, 'All sections found.'),
        buildScoreComponent('keywords', 82, 0.3, 'Keywords: 82% of expected terms present.'),
      ],
      matched: ['react', 'typescript'],
      missing: ['docker'],
      partial: ['graphql'],
      explanations: ['Parsed cleanly.', 'All sections found.', 'Keywords: 82% of expected terms present.'],
    } satisfies ScoreResult

    const jdMatchScore = {
      score: 84,
      breakdown: [buildScoreComponent('requiredSkills', 92, 1, 'Required skills: 5 of 6 demonstrated.')],
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
      breakdown: [],
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

describe('ScoreComponent', () => {
  it('computes weightedScore as rawScore × weight', () => {
    const component = buildScoreComponent('requiredSkills', 80, 0.25, 'x')
    expect(component).toEqual({ category: 'requiredSkills', rawScore: 80, weight: 0.25, weightedScore: 20, explanation: 'x', evidence: [] })
  })

  it('makes the overall score exactly the rounded sum of weighted contributions', () => {
    const breakdown = [buildScoreComponent('a', 90, 0.5, ''), buildScoreComponent('b', 71, 0.5, '')]
    expect(totalWeightedScore(breakdown)).toBe(81) // 45 + 35.5 = 80.5 → 81
    expect(totalWeightedScore([buildScoreComponent('a', 250, 1, '')])).toBe(100)
  })

  it('supports keyed lookup over the ordered array', () => {
    const breakdown = [buildScoreComponent('a', 90, 0.5, ''), buildScoreComponent('b', 70, 0.5, '')]
    expect(getScoreComponent(breakdown, 'b')?.rawScore).toBe(70)
    expect(rawScoresByCategory(breakdown)).toEqual({ a: 90, b: 70 })
  })
})
