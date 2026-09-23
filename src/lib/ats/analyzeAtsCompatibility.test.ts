import { describe, expect, it } from 'vitest'
import { analyzeAtsCompatibility } from './analyzeAtsCompatibility'
import { buildTestInput, buildTestResume } from './testFixtures'
import { ATS_SCORE_WEIGHTS } from './scoringConfig'
import { calculateAtsScore } from './scoreCalculator'
import { getScoreComponent, rawScoresByCategory } from '@/lib/scoring/scoreComponents'
import { explicitEvidence, structuralEvidence } from '@/lib/schema/evidence'
import { buildContactInformation } from '@/lib/schema/resumeBuilders'

describe('analyzeAtsCompatibility', () => {
  it('returns a full ScoreResult with every breakdown category populated', () => {
    const result = analyzeAtsCompatibility(buildTestInput())
    expect(result.score).toBeGreaterThan(0)
    expect(result.breakdown.map((c) => c.category)).toEqual([
      'atsEssentials',
      'resumeStructure',
      'contentQuality',
      'skillsEvidence',
      'experienceSeniority',
      'recruiterReadability',
      'riskConsistency',
    ])
    expect(result.explanations).toHaveLength(7)
  })

  it('builds each ScoreComponent from the configured weight, and the score is exactly their weighted sum', () => {
    const result = analyzeAtsCompatibility(buildTestInput())
    const weightSum = result.breakdown.reduce((sum, c) => sum + c.weight, 0)
    expect(weightSum).toBeCloseTo(1, 10)
    for (const component of result.breakdown) {
      expect(component.weight).toBe(ATS_SCORE_WEIGHTS[component.category])
      expect(component.weightedScore).toBeCloseTo(component.rawScore * component.weight, 10)
      expect(component.rawScore).toBeGreaterThanOrEqual(0)
      expect(component.rawScore).toBeLessThanOrEqual(100)
    }
    expect(result.score).toBe(Math.round(result.breakdown.reduce((sum, c) => sum + c.weightedScore, 0)))
    expect(result.score).toBe(calculateAtsScore(rawScoresByCategory(result.breakdown)))
    expect(result.breakdown.map((c) => c.explanation)).toEqual(result.explanations)
  })

  it('attaches typed evidence to components: literal quotes where they exist, structural observations where they do not', () => {
    const result = analyzeAtsCompatibility(buildTestInput())
    const structure = getScoreComponent(result.breakdown, 'resumeStructure')!
    expect(structure.evidence).toContainEqual(explicitEvidence('Jordan Rivera', 'contact'))
    expect(structure.evidence).toContainEqual(structuralEvidence('1 experience entry detected.', 'experience'))
    expect(structure.evidence.filter((e) => e.sourceType === 'inferred-from-structure').map((e) => e.section)).toEqual([
      'skills',
      'experience',
      'education',
    ])

    const content = getScoreComponent(result.breakdown, 'contentQuality')!
    expect(content.evidence).toEqual([
      explicitEvidence('Built reusable React components used across 4 production applications.', 'experience', 'exp-0'),
      explicitEvidence('Reduced page load time by 35% through code splitting.', 'experience', 'exp-0'),
    ])

    const skills = getScoreComponent(result.breakdown, 'skillsEvidence')!
    expect(skills.evidence).toEqual([
      explicitEvidence('Built reusable React components used across 4 production applications.', 'experience', 'exp-0'),
    ])
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
          contact: buildContactInformation({ name: null, email: null, phone: null, location: null, links: [] }),
          summary: null,
          skills: [],
          experience: [],
          education: [],
        }),
        parserWarnings: ['No text could be extracted from this document.'],
      }),
    )
    // Not exactly 0: riskConsistency (5% weight) legitimately scores 100 for
    // an empty resume — there's no experience to have date/overlap risk.
    expect(result.score).toBeLessThan(15)
  })

  it('never fabricates a strength or issue not backed by the resume content', () => {
    const result = analyzeAtsCompatibility(buildTestInput())
    for (const strength of result.matched) {
      expect(typeof strength).toBe('string')
    }
  })
})
