import { describe, expect, it } from 'vitest'
import { analyzeFormatting } from './formattingAnalyzer'
import { buildTestInput, buildTestResume } from './testFixtures'
import { buildExperienceEntries } from '@/lib/schema/resumeBuilders'

describe('analyzeFormatting', () => {
  it('scores 100 with no risk signals', () => {
    expect(analyzeFormatting(buildTestInput()).score).toBe(100)
  })

  it('penalizes a document the parser flagged as hard to extract', () => {
    const result = analyzeFormatting(buildTestInput({ parserWarnings: ['No text could be extracted from this document.'] }))
    expect(result.score).toBe(60)
  })

  it('penalizes experience entries without bullet points', () => {
    const resume = buildTestResume({
      experience: buildExperienceEntries([
        { company: 'Acme', title: 'Engineer', startDate: null, endDate: null, location: null, bullets: [] },
      ]),
    })
    const result = analyzeFormatting(buildTestInput({ resume }))
    expect(result.score).toBe(90)
    expect(result.issues[0]).toContain('paragraph text')
  })
})
