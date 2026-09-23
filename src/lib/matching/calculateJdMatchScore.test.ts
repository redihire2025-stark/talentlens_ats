import { describe, expect, it } from 'vitest'
import { calculateJdMatchScore } from './calculateJdMatchScore'
import { matchResume } from './matchResume'
import { buildTestMatchInput, buildTestJobDescription, buildTestResume } from './testFixtures'
import { JD_MATCH_SCORE_WEIGHTS } from './scoringConfig'
import { getScoreComponent } from '@/lib/scoring/scoreComponents'
import { explicitEvidence } from '@/lib/schema/evidence'

describe('calculateJdMatchScore', () => {
  it('returns a full ScoreResult with every breakdown category populated', () => {
    const input = buildTestMatchInput()
    const analysis = matchResume(input)
    const result = calculateJdMatchScore(input, analysis, 85)

    expect(result.breakdown.map((c) => c.category)).toEqual([
      'requiredSkills',
      'preferredSkills',
      'experience',
      'responsibilities',
      'title',
      'education',
      'keywords',
      'atsCompatibility',
    ])
    expect(getScoreComponent(result.breakdown, 'atsCompatibility')?.rawScore).toBe(85)
    expect(result.explanations).toHaveLength(8)
  })

  it('builds every component from the configured weight; the score is exactly the weighted sum', () => {
    const input = buildTestMatchInput()
    const result = calculateJdMatchScore(input, matchResume(input), 85)
    expect(result.breakdown.reduce((sum, c) => sum + c.weight, 0)).toBeCloseTo(1, 10)
    for (const c of result.breakdown) {
      expect(c.weight).toBe(JD_MATCH_SCORE_WEIGHTS[c.category])
      expect(c.weightedScore).toBeCloseTo(c.rawScore * c.weight, 10)
    }
    expect(result.score).toBe(Math.round(result.breakdown.reduce((sum, c) => sum + c.weightedScore, 0)))
    // Required skills: React + TypeScript matched, Docker missing → 67.
    const required = getScoreComponent(result.breakdown, 'requiredSkills')!
    expect(required.rawScore).toBe(67)
    expect(required.weightedScore).toBeCloseTo(16.75, 10)
    expect(required.explanation).toBe('Required skills: 67% (2 of 3 matched).')
  })

  it('attaches the matched entries\' typed evidence to each component, and none for a missing requirement', () => {
    const input = buildTestMatchInput()
    const result = calculateJdMatchScore(input, matchResume(input), 85)
    const required = getScoreComponent(result.breakdown, 'requiredSkills')!
    expect(required.evidence.map((e) => e.text)).toEqual(expect.arrayContaining(['React', 'TypeScript']))
    expect(required.evidence.some((e) => e.text.includes('Docker'))).toBe(false)
    expect(getScoreComponent(result.breakdown, 'title')!.evidence).toEqual([
      explicitEvidence('Frontend Engineer, Acme Corp', 'experience', 'exp-0'),
    ])
    expect(getScoreComponent(result.breakdown, 'atsCompatibility')!.evidence).toEqual([])
  })

  it('is deterministic for the same input', () => {
    const input = buildTestMatchInput()
    const analysis = matchResume(input)
    expect(calculateJdMatchScore(input, analysis, 85)).toEqual(calculateJdMatchScore(input, analysis, 85))
  })

  it('scores 100 when everything matches and the ATS score is perfect', () => {
    const input = buildTestMatchInput({
      jobDescription: buildTestJobDescription({
        requiredSkills: ['React', 'TypeScript'],
        preferredSkills: [],
        experience: { minimumYears: null, maximumYears: null },
        responsibilities: [],
        title: null,
        education: [],
        keywords: ['React', 'TypeScript'],
      }),
    })
    const analysis = matchResume(input)
    const result = calculateJdMatchScore(input, analysis, 100)
    expect(result.score).toBe(100)
  })

  it('scores low when nothing matches and the ATS score is poor', () => {
    const input = buildTestMatchInput({
      resume: buildTestResume({ skills: [], experience: [], education: [] }),
      jobDescription: buildTestJobDescription({
        requiredSkills: ['Docker', 'Kubernetes'],
        preferredSkills: ['Terraform'],
      }),
    })
    const analysis = matchResume(input)
    const result = calculateJdMatchScore(input, analysis, 10)
    expect(result.score).toBeLessThan(30)
  })

  it('separates matched, partial, and missing skills across required and preferred', () => {
    const input = buildTestMatchInput()
    const analysis = matchResume(input)
    const result = calculateJdMatchScore(input, analysis, 85)
    expect(result.matched).toContain('react')
    expect(result.missing).toContain('docker')
  })
})
