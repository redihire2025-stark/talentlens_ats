import { describe, expect, it } from 'vitest'
import { explanationForCategory, scoreToHealthStatus } from './atsCategoryDisplay'
import { analyzeAtsCompatibility } from '@/lib/ats/analyzeAtsCompatibility'
import { buildTestInput } from '@/lib/ats/testFixtures'

describe('scoreToHealthStatus', () => {
  it('matches the thresholds used elsewhere in the UI (85/70)', () => {
    expect(scoreToHealthStatus(90)).toBe('strong')
    expect(scoreToHealthStatus(85)).toBe('strong')
    expect(scoreToHealthStatus(75)).toBe('good')
    expect(scoreToHealthStatus(70)).toBe('good')
    expect(scoreToHealthStatus(50)).toBe('needs-improvement')
  })
})

describe('explanationForCategory', () => {
  it('returns the explanation matching a real ScoreResult, by category order', () => {
    const result = analyzeAtsCompatibility(buildTestInput())
    const sectionsExplanation = explanationForCategory(result.explanations, 'resumeStructure')
    expect(sectionsExplanation).toBe(result.explanations[1])
    expect(sectionsExplanation.toLowerCase()).toContain('section')
  })

  it('agrees with each ScoreComponent\'s own explanation', () => {
    const result = analyzeAtsCompatibility(buildTestInput())
    for (const component of result.breakdown) {
      expect(explanationForCategory(result.explanations, component.category)).toBe(component.explanation)
    }
  })
})
