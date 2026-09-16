import { describe, expect, it } from 'vitest'
import { normalizeKeyword } from './keywordNormalization'

describe('normalizeKeyword', () => {
  it('trims, lowercases, and collapses internal whitespace', () => {
    expect(normalizeKeyword('  Cross   Functional  Collaboration  ')).toBe('cross functional collaboration')
  })
})
