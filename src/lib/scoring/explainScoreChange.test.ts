import { describe, expect, it } from 'vitest'
import { diffScoreBreakdown, explainScoreChange, formatScoreChange } from './explainScoreChange'
import { buildScoreComponent } from './scoreComponents'
import type { ScoreBreakdown, ScoreResult } from '@/types/score'

/** A breakdown with every category at the given raw score; equal weights unless given. */
function breakdown<K extends string>(scores: Record<K, number>, weights: Partial<Record<K, number>> = {}): ScoreBreakdown<K> {
  const keys = Object.keys(scores) as K[]
  return keys.map((k) => buildScoreComponent(k, scores[k], weights[k] ?? 1 / keys.length, ''))
}

function result<K extends string>(score: number, scores: Record<K, number>): ScoreResult<K> {
  return { score, breakdown: breakdown(scores), matched: [], missing: [], partial: [], explanations: [] }
}

describe('diffScoreBreakdown', () => {
  it('computes a per-category delta, largest change first', () => {
    const weights = { requiredSkills: 0.25, responsibilities: 0.15, riskConsistency: 0.05 }
    const before = breakdown({ requiredSkills: 60, responsibilities: 50, riskConsistency: 90 }, weights)
    const after = breakdown({ requiredSkills: 65, responsibilities: 52, riskConsistency: 89 }, weights)
    const entries = diffScoreBreakdown(before, after, {
      requiredSkills: 'Required Skill Coverage',
      responsibilities: 'Responsibility Alignment',
      riskConsistency: 'Risk/Consistency',
    })

    expect(entries).toEqual([
      { category: 'requiredSkills', label: 'Required Skill Coverage', before: 60, after: 65, delta: 5, weight: 0.25, weightedDelta: 1.25 },
      { category: 'responsibilities', label: 'Responsibility Alignment', before: 50, after: 52, delta: 2, weight: 0.15, weightedDelta: 0.3 },
      { category: 'riskConsistency', label: 'Risk/Consistency', before: 90, after: 89, delta: -1, weight: 0.05, weightedDelta: -0.05 },
    ])
  })

  it('reports how much of the overall score each category change accounts for', () => {
    const entries = diffScoreBreakdown(breakdown({ a: 40 }, { a: 0.2 }), breakdown({ a: 90 }, { a: 0.2 }))
    expect(entries[0]!.delta).toBe(50)
    expect(entries[0]!.weightedDelta).toBe(10)
  })

  it('omits categories with no change', () => {
    const before = breakdown({ a: 10, b: 20 })
    const after = breakdown({ a: 10, b: 25 })
    expect(diffScoreBreakdown(before, after)).toEqual([{ category: 'b', label: 'b', before: 20, after: 25, delta: 5, weight: 0.5, weightedDelta: 2.5 }])
  })

  it('falls back to the raw key when no label is given', () => {
    const entries = diffScoreBreakdown(breakdown({ x: 1 }), breakdown({ x: 2 }))
    expect(entries[0]!.label).toBe('x')
  })

  it('skips a category present in only one breakdown', () => {
    const before = breakdown<string>({ a: 10, onlyBefore: 5 })
    const after = breakdown<string>({ a: 12, onlyAfter: 5 })
    const entries = diffScoreBreakdown(before, after)
    expect(entries.map((e) => e.category)).toEqual(['a'])
  })

  it('is empty for identical breakdowns', () => {
    const b = breakdown({ a: 10, b: 20 })
    expect(diffScoreBreakdown(b, b.map((c) => ({ ...c })))).toEqual([])
  })
})

describe('formatScoreChange', () => {
  it('matches the spec example phrasing', () => {
    const entries = diffScoreBreakdown(
      breakdown({ requiredSkills: 60, responsibilities: 50, riskConsistency: 90 }),
      breakdown({ requiredSkills: 65, responsibilities: 52, riskConsistency: 89 }),
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
    const before = result(64, { requiredSkills: 60, responsibilities: 50 })
    const after = result(71, { requiredSkills: 65, responsibilities: 52 })
    const explained = explainScoreChange(before, after, { requiredSkills: 'Required Skills', responsibilities: 'Responsibilities' })

    expect(explained.overallDelta).toBe(7)
    expect(explained.entries).toHaveLength(2)
    expect(explained.summary).toBe('+5 Required Skills, +2 Responsibilities')
  })
})
