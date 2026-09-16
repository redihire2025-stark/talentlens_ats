import { describe, expect, it } from 'vitest'
import { calculateAtsScore } from './scoreCalculator'
import type { AtsScoreBreakdown } from './types'

function breakdown(overrides: Partial<AtsScoreBreakdown> = {}): AtsScoreBreakdown {
  return {
    parsing: 100,
    sections: 100,
    keywords: 100,
    experience: 100,
    skillsEvidence: 100,
    formatting: 100,
    contentQuality: 100,
    ...overrides,
  }
}

describe('calculateAtsScore', () => {
  it('returns 100 when every category is a perfect score', () => {
    expect(calculateAtsScore(breakdown())).toBe(100)
  })

  it('returns 0 when every category is 0', () => {
    expect(
      calculateAtsScore(
        breakdown({ parsing: 0, sections: 0, keywords: 0, experience: 0, skillsEvidence: 0, formatting: 0, contentQuality: 0 }),
      ),
    ).toBe(0)
  })

  it('weights categories rather than averaging them equally', () => {
    // sections (weight 0.2) at 0 vs formatting (weight 0.1) at 0 should not produce the same score.
    const sectionsZero = calculateAtsScore(breakdown({ sections: 0 }))
    const formattingZero = calculateAtsScore(breakdown({ formatting: 0 }))
    expect(sectionsZero).toBeLessThan(formattingZero)
  })

  it('is deterministic for the same input', () => {
    const input = breakdown({ parsing: 73, sections: 88, keywords: 40 })
    expect(calculateAtsScore(input)).toBe(calculateAtsScore(input))
  })
})
