import { describe, expect, it } from 'vitest'
import { analyzeKeywords } from './keywordAnalyzer'
import { buildTestInput, buildTestResume } from './testFixtures'
import { buildResumeSkills } from '@/lib/schema/resumeBuilders'

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
      skills: buildResumeSkills([
        { rawName: 'React', category: 'framework' },
        { rawName: 'React.js', category: 'framework' },
      ]),
    })
    const result = analyzeKeywords(buildTestInput({ resume }))
    expect(result.strengths[0]).toContain('1 distinct skill keyword')
  })

  it('caps the score at 100 for many distinct skills', () => {
    const resume = buildTestResume({
      skills: buildResumeSkills(Array.from({ length: 12 }, (_, i) => ({ rawName: `Skill${i}` }))),
    })
    expect(analyzeKeywords(buildTestInput({ resume })).score).toBe(100)
  })
})
