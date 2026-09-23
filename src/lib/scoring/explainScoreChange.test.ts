import { describe, expect, it } from 'vitest'
import { diffScoreBreakdown, explainScoreChange, formatScoreChange } from './explainScoreChange'

describe('diffScoreBreakdown', () => {
  it('computes a per-category delta, largest change first', () => {
    const before = { requiredSkills: 60, responsibilities: 50, riskConsistency: 90 }
    const after = { requiredSkills: 65, responsibilities: 52, riskConsistency: 89 }
    const entries = diffScoreBreakdown(before, after, { requiredSkills: 'Required Skill Coverage', responsibilities: 'Responsibility Alignment', riskConsistency: 'Risk/Consistency' })

    expect(entries).toEqual([
      { category: 'requiredSkills', label: 'Required Skill Coverage', before: 60, after: 65, delta: 5 },
      { category: 'responsibilities', label: 'Responsibility Alignment', before: 50, after: 52, delta: 2 },
      { category: 'riskConsistency', label: 'Risk/Consistency', before: 90, after: 89, delta: -1 },
    ])
  })

  it('omits categories with no change', () => {
    const before = { a: 10, b: 20 }
    const after = { a: 10, b: 25 }
    expect(diffScoreBreakdown(before, after)).toEqual([{ category: 'b', label: 'b', before: 20, after: 25, delta: 5 }])
  })

  it('falls back to the raw key when no label is given', () => {
    const entries = diffScoreBreakdown({ x: 1 }, { x: 2 })
    expect(entries[0].label).toBe('x')
  })

  it('skips a category present in only one breakdown', () => {
    const before = { a: 10, onlyBefore: 5 } as Record<string, number>
    const after = { a: 12, onlyAfter: 5 } as Record<string, number>
    const entries = diffScoreBreakdown(before, after)
    expect(entries.map((e) => e.category)).toEqual(['a'])
  })

  it('is empty for identical breakdowns', () => {
    const breakdown = { a: 10, b: 20 }
    expect(diffScoreBreakdown(breakdown, { ...breakdown })).toEqual([])
  })
})

describe('formatScoreChange', () => {
  it('matches the spec example phrasing', () => {
    const entries = diffScoreBreakdown(
      { requiredSkills: 60, responsibilities: 50, riskConsistency: 90 },
      { requiredSkills: 65, responsibilities: 52, riskConsistency: 89 },
      { requiredSkills: 'Required Skill Coverage', responsibilities: 'Responsibility Alignment', riskConsistency: 'Risk/Consistency' },
    )
    expect(formatScoreChange(entries)).toBe('+5 Required Skill Coverage, +2 Responsibility Alignment, -1 Risk/Consistency')
  })

  it('reports no change plainly', () => {
    expect(formatScoreChange([])).toBe('No change in any score component.')
  })
})

describe('explainScoreChange', () => {
  it('diffs two ScoreResults and reports the overall delta', () => {
    const before = { score: 64, breakdown: { requiredSkills: 60, responsibilities: 50 }, matched: [], missing: [], partial: [], explanations: [] }
    const after = { score: 71, breakdown: { requiredSkills: 65, responsibilities: 52 }, matched: [], missing: [], partial: [], explanations: [] }
    const result = explainScoreChange(before, after, { requiredSkills: 'Required Skills', responsibilities: 'Responsibilities' })

    expect(result.overallDelta).toBe(7)
    expect(result.entries).toHaveLength(2)
    expect(result.summary).toBe('+5 Required Skills, +2 Responsibilities')
  })
})
