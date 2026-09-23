import { describe, expect, it } from 'vitest'
import { analyzeSections } from './sectionAnalyzer'
import { buildTestInput, buildTestResume } from './testFixtures'
import { buildContactInformation } from '@/lib/schema/resumeBuilders'

describe('analyzeSections', () => {
  it('scores 100 when every section is present', () => {
    expect(analyzeSections(buildTestInput()).score).toBe(100)
  })

  it('flags missing experience as an issue', () => {
    const result = analyzeSections(buildTestInput({ resume: buildTestResume({ experience: [] }) }))
    expect(result.score).toBeLessThan(100)
    expect(result.issues).toContain('Experience section not found.')
  })

  it('scores 0 when nothing is present', () => {
    const result = analyzeSections(
      buildTestInput({
        resume: buildTestResume({
          contact: buildContactInformation({ name: null, email: null, phone: null, location: null, links: [] }),
          summary: null,
          skills: [],
          experience: [],
          education: [],
        }),
      }),
    )
    expect(result.score).toBe(0)
  })
})
