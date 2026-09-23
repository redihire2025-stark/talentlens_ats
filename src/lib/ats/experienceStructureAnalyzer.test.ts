import { describe, expect, it } from 'vitest'
import { analyzeExperienceStructure } from './experienceStructureAnalyzer'
import { buildTestInput, buildTestResume } from './testFixtures'
import { buildExperienceEntries } from '@/lib/schema/resumeBuilders'

describe('analyzeExperienceStructure', () => {
  it('scores 100 when every entry is fully structured', () => {
    expect(analyzeExperienceStructure(buildTestInput()).score).toBe(100)
  })

  it('scores 0 with no experience entries', () => {
    const result = analyzeExperienceStructure(buildTestInput({ resume: buildTestResume({ experience: [] }) }))
    expect(result.score).toBe(0)
    expect(result.issues).toContain('No work experience entries were found.')
  })

  it('flags an entry missing a company or bullets, without penalizing well-structured entries', () => {
    const resume = buildTestResume({
      experience: buildExperienceEntries([
        {
          company: 'Acme Corp',
          title: 'Frontend Engineer',
          startDate: '2021-03-01',
          endDate: null,
          location: null,
          bullets: ['Built things.'],
        },
        { company: '', title: 'Baker', startDate: null, endDate: null, location: null, bullets: [] },
      ]),
    })
    const result = analyzeExperienceStructure(buildTestInput({ resume }))
    expect(result.score).toBe(50)
    expect(result.issues[0]).toContain('Experience entry 2')
  })
})
