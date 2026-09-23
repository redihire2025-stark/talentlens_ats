import { describe, expect, it } from 'vitest'
import { calculateAtsScore } from './scoreCalculator'
import type { AtsScoreWeights } from './types'

function breakdown(overrides: Partial<AtsScoreWeights> = {}): AtsScoreWeights {
  return {
    atsEssentials: 100,
    resumeStructure: 100,
    contentQuality: 100,
    skillsEvidence: 100,
    experienceSeniority: 100,
    recruiterReadability: 100,
    riskConsistency: 100,
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
        breakdown({
          atsEssentials: 0,
          resumeStructure: 0,
          contentQuality: 0,
          skillsEvidence: 0,
          experienceSeniority: 0,
          recruiterReadability: 0,
          riskConsistency: 0,
        }),
      ),
    ).toBe(0)
  })

  it('weights categories rather than averaging them equally', () => {
    // resumeStructure (weight 0.2) at 0 vs riskConsistency (weight 0.05) at 0 should not produce the same score.
    const structureZero = calculateAtsScore(breakdown({ resumeStructure: 0 }))
    const riskZero = calculateAtsScore(breakdown({ riskConsistency: 0 }))
    expect(structureZero).toBeLessThan(riskZero)
  })

  it('is deterministic for the same input', () => {
    const input = breakdown({ atsEssentials: 73, resumeStructure: 88, skillsEvidence: 40 })
    expect(calculateAtsScore(input)).toBe(calculateAtsScore(input))
  })
})
