import { describe, expect, it } from 'vitest'
import { analyzeSkillsEvidence } from './skillsEvidenceAnalyzer'
import { buildTestInput, buildTestResume } from './testFixtures'

describe('analyzeSkillsEvidence', () => {
  it('scores 0 with no skills', () => {
    expect(analyzeSkillsEvidence(buildTestInput({ resume: buildTestResume({ skills: [] }) })).score).toBe(0)
  })

  it('credits a skill mentioned in an experience bullet', () => {
    const resume = buildTestResume({
      skills: [{ name: 'React', category: 'framework', evidence: ['React'] }],
      experience: [
        {
          company: 'Acme',
          title: 'Engineer',
          startDate: '2021-01-01',
          endDate: null,
          location: null,
          bullets: ['Built reusable React components.'],
        },
      ],
    })
    const result = analyzeSkillsEvidence(buildTestInput({ resume }))
    expect(result.score).toBe(100)
    expect(result.issues).toEqual([])
  })

  it('flags a skill that only appears in the skills list', () => {
    const resume = buildTestResume({
      skills: [{ name: 'Docker', category: 'tool', evidence: ['Docker'] }],
      experience: [
        { company: 'Acme', title: 'Engineer', startDate: null, endDate: null, location: null, bullets: ['Built things.'] },
      ],
    })
    const result = analyzeSkillsEvidence(buildTestInput({ resume }))
    expect(result.score).toBe(0)
    expect(result.issues[0]).toContain('Docker')
  })
})
