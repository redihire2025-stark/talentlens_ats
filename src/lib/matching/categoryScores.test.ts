import { describe, expect, it } from 'vitest'
import { scoreEntries, scoreSingleResult } from './categoryScores'

describe('scoreEntries', () => {
  it('gives full credit for an empty list (nothing required)', () => {
    expect(scoreEntries([])).toBe(100)
  })

  it('averages matched/partial/missing entries', () => {
    expect(scoreEntries([{ status: 'matched' }, { status: 'partial' }, { status: 'missing' }])).toBe(50)
  })

  it('scores all-matched as 100 and all-missing as 0', () => {
    expect(scoreEntries([{ status: 'matched' }, { status: 'matched' }])).toBe(100)
    expect(scoreEntries([{ status: 'missing' }, { status: 'missing' }])).toBe(0)
  })
})

describe('scoreSingleResult', () => {
  it('gives full credit when not required', () => {
    expect(scoreSingleResult({ status: 'missing', required: false })).toBe(100)
  })

  it('scores by status when required', () => {
    expect(scoreSingleResult({ status: 'matched', required: true })).toBe(100)
    expect(scoreSingleResult({ status: 'partial', required: true })).toBe(50)
    expect(scoreSingleResult({ status: 'missing', required: true })).toBe(0)
  })
})
