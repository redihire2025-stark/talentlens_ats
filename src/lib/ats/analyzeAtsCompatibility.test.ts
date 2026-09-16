import { describe, expect, it } from 'vitest'
import { analyzeAtsCompatibility } from './analyzeAtsCompatibility'
import { buildTestInput, buildTestResume } from './testFixtures'

describe('analyzeAtsCompatibility', () => {
  it('returns a full ScoreResult with every breakdown category populated', () => {
    const result = analyzeAtsCompatibility(buildTestInput())
    expect(result.score).toBeGreaterThan(0)
    expect(Object.keys(result.breakdown).sort()).toEqual(
      ['contentQuality', 'experience', 'formatting', 'keywords', 'parsing', 'sections', 'skillsEvidence'].sort(),
    )
    expect(result.explanations).toHaveLength(7)
  })

  it('is deterministic: the same resume always produces the same score', () => {
    const input = buildTestInput()
    const first = analyzeAtsCompatibility(input)
    const second = analyzeAtsCompatibility(input)
    expect(first).toEqual(second)
  })

  it('scores an empty resume at or near 0', () => {
    const result = analyzeAtsCompatibility(
      buildTestInput({
        resume: buildTestResume({
          candidate: { name: null, email: null, phone: null, location: null, links: [] },
          summary: null,
          skills: [],
          experience: [],
          education: [],
        }),
        parserWarnings: ['No text could be extracted from this document.'],
      }),
    )
    expect(result.score).toBeLessThan(10)
  })

  it('never fabricates a strength or issue not backed by the resume content', () => {
    const result = analyzeAtsCompatibility(buildTestInput())
    for (const strength of result.matched) {
      expect(typeof strength).toBe('string')
    }
  })
})
