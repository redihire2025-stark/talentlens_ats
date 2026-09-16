import { describe, expect, it } from 'vitest'
import { analyzeParsing } from './parsingAnalyzer'
import { buildTestInput } from './testFixtures'

describe('analyzeParsing', () => {
  it('scores 0 when no text could be extracted', () => {
    const result = analyzeParsing(buildTestInput({ parserWarnings: ['No text could be extracted from this document.'] }))
    expect(result.score).toBe(0)
  })

  it('scores low for a very short document', () => {
    const result = analyzeParsing(
      buildTestInput({ parserWarnings: ['This document is very short for a resume — parsing may be incomplete.'] }),
    )
    expect(result.score).toBe(40)
  })

  it('scores 100 with no warnings', () => {
    const result = analyzeParsing(buildTestInput({ parserWarnings: [] }))
    expect(result.score).toBe(100)
  })

  it('scores lower, but not critically, for minor warnings', () => {
    const result = analyzeParsing(buildTestInput({ parserWarnings: ['No skills section was detected.'] }))
    expect(result.score).toBe(90)
    expect(result.score).toBeGreaterThan(0)
  })
})
