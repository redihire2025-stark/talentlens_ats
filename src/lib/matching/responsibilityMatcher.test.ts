import { describe, expect, it } from 'vitest'
import { matchResponsibilities } from './responsibilityMatcher'
import { buildTestMatchInput, buildTestJobDescription, buildTestResume } from './testFixtures'

describe('matchResponsibilities', () => {
  it('matches a responsibility closely reflected in a resume bullet', () => {
    const [result] = matchResponsibilities(buildTestMatchInput())
    expect(result!.status).toBe('matched')
  })

  it('reports missing for a responsibility with no related bullet', () => {
    const [result] = matchResponsibilities(
      buildTestMatchInput({
        jobDescription: buildTestJobDescription({ responsibilities: ['Manage a team of 10 direct reports.'] }),
      }),
    )
    expect(result!.status).toBe('missing')
  })

  it('returns one entry per JD responsibility, in order', () => {
    const results = matchResponsibilities(
      buildTestMatchInput({
        jobDescription: buildTestJobDescription({
          responsibilities: ['Build reusable components for production applications.', 'Manage a team of 10 direct reports.'],
        }),
      }),
    )
    expect(results.map((r) => r.responsibility)).toEqual([
      'Build reusable components for production applications.',
      'Manage a team of 10 direct reports.',
    ])
  })

  it('handles a resume with no bullets without crashing', () => {
    const resume = buildTestResume({ experience: [], projects: [] })
    const results = matchResponsibilities(buildTestMatchInput({ resume }))
    expect(results.every((r) => r.status === 'missing')).toBe(true)
  })
})
