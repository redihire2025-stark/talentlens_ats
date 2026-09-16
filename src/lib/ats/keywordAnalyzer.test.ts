import { describe, expect, it } from 'vitest'
import { analyzeKeywords } from './keywordAnalyzer'
import { buildTestInput, buildTestResume } from './testFixtures'

describe('analyzeKeywords', () => {
  it('scores 0 with no skills', () => {
    expect(analyzeKeywords(buildTestInput({ resume: buildTestResume({ skills: [] }) })).score).toBe(0)
  })

  it('scores proportionally to distinct skills found, up to the target', () => {
    const twoSkills = analyzeKeywords(buildTestInput()).score // fixture has 2 distinct skills
    expect(twoSkills).toBe(25) // 2/8 -> 25%
  })

  it('deduplicates skill variants via the normalization dictionary', () => {
    const resume = buildTestResume({
      skills: [
        { name: 'React', category: 'framework', evidence: [] },
        { name: 'React.js', category: 'framework', evidence: [] },
      ],
    })
    const result = analyzeKeywords(buildTestInput({ resume }))
    expect(result.strengths[0]).toContain('1 distinct skill keyword')
  })

  it('caps the score at 100 for many distinct skills', () => {
    const resume = buildTestResume({
      skills: Array.from({ length: 12 }, (_, i) => ({ name: `Skill${i}`, category: 'other' as const, evidence: [] })),
    })
    expect(analyzeKeywords(buildTestInput({ resume })).score).toBe(100)
  })
})
