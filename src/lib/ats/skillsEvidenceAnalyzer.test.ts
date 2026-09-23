import { describe, expect, it } from 'vitest'
import { analyzeSkillsEvidence } from './skillsEvidenceAnalyzer'
import { buildTestInput, buildTestResume } from './testFixtures'
import { buildExperienceEntries, buildResumeSkills } from '@/lib/schema/resumeBuilders'

describe('analyzeSkillsEvidence', () => {
  it('scores 0 with no skills', () => {
    expect(analyzeSkillsEvidence(buildTestInput({ resume: buildTestResume({ skills: [] }) })).score).toBe(0)
  })

  it('credits a skill mentioned in an experience bullet', () => {
    const resume = buildTestResume({
      skills: buildResumeSkills([{ rawName: 'React', category: 'framework' }]),
      experience: buildExperienceEntries([
        {
          company: 'Acme',
          title: 'Engineer',
          startDate: '2021-01-01',
          endDate: null,
          location: null,
          bullets: ['Built reusable React components.'],
        },
      ]),
    })
    const result = analyzeSkillsEvidence(buildTestInput({ resume }))
    expect(result.score).toBe(100)
    expect(result.issues).toEqual([])
  })

  it('flags a skill that only appears in the skills list', () => {
    const resume = buildTestResume({
      skills: buildResumeSkills([{ rawName: 'Docker', category: 'tool' }]),
      experience: buildExperienceEntries([
        { company: 'Acme', title: 'Engineer', startDate: null, endDate: null, location: null, bullets: ['Built things.'] },
      ]),
    })
    const result = analyzeSkillsEvidence(buildTestInput({ resume }))
    expect(result.score).toBe(0)
    expect(result.issues[0]).toContain('Docker')
  })
})
