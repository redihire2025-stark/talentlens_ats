import { describe, expect, it } from 'vitest'
import { matchTitle } from './titleMatcher'
import { buildTestMatchInput, buildTestJobDescription, buildTestResume } from './testFixtures'

describe('matchTitle', () => {
  it('matches when the core title is the same after normalization', () => {
    const result = matchTitle(
      buildTestMatchInput({ jobDescription: buildTestJobDescription({ title: 'Front-End Engineer' }) }),
    )
    expect(result.status).toBe('matched')
  })

  it('notes a seniority difference without failing the match', () => {
    const result = matchTitle(
      buildTestMatchInput({ jobDescription: buildTestJobDescription({ title: 'Senior Frontend Engineer' }) }),
    )
    expect(result.status).toBe('matched')
    expect(result.explanation).toContain('seniority differs')
  })

  it('treats an unrelated title as missing', () => {
    const result = matchTitle(buildTestMatchInput({ jobDescription: buildTestJobDescription({ title: 'Data Scientist' }) }))
    expect(result.status).toBe('missing')
  })

  it('is not required when the JD does not state a title', () => {
    const result = matchTitle(buildTestMatchInput({ jobDescription: buildTestJobDescription({ title: null }) }))
    expect(result.required).toBe(false)
    expect(result.status).toBe('matched')
  })

  it('is missing when the resume has no experience at all', () => {
    const result = matchTitle(buildTestMatchInput({ resume: buildTestResume({ experience: [] }) }))
    expect(result.status).toBe('missing')
  })
})
