import { describe, expect, it } from 'vitest'
import { analyzeRiskConsistency } from './riskConsistencyAnalyzer'
import { buildTestInput, buildTestResume } from './testFixtures'
import { buildContactInformation, buildExperienceEntries } from '@/lib/schema/resumeBuilders'

describe('analyzeRiskConsistency', () => {
  it('scores a clean, non-overlapping resume at 100 with no issues', () => {
    const result = analyzeRiskConsistency(buildTestInput())
    expect(result.score).toBe(100)
    expect(result.issues).toEqual([])
  })

  it('flags an experience entry whose end date is before its start date', () => {
    const result = analyzeRiskConsistency(
      buildTestInput({
        resume: buildTestResume({
          experience: buildExperienceEntries([
            {
              company: 'Acme Corp',
              title: 'Engineer',
              startDate: '2022-01-01',
              endDate: '2021-01-01',
              location: null,
              bullets: [],
            },
          ]),
        }),
      }),
    )
    expect(result.score).toBeLessThan(100)
    expect(result.issues.join(' ')).toMatch(/end date earlier than/i)
  })

  it('flags overlapping employment at two different companies', () => {
    const result = analyzeRiskConsistency(
      buildTestInput({
        resume: buildTestResume({
          experience: buildExperienceEntries([
            { company: 'Acme Corp', title: 'Engineer', startDate: '2020-01-01', endDate: '2022-01-01', location: null, bullets: [] },
            { company: 'Globex', title: 'Consultant', startDate: '2021-01-01', endDate: '2022-06-01', location: null, bullets: [] },
          ]),
        }),
      }),
    )
    expect(result.score).toBeLessThan(100)
    expect(result.issues.join(' ')).toMatch(/overlapping employment/i)
  })

  it('flags a duplicate-looking entry: same company, title, and overlapping dates', () => {
    const result = analyzeRiskConsistency(
      buildTestInput({
        resume: buildTestResume({
          experience: buildExperienceEntries([
            { company: 'Acme Corp', title: 'Engineer', startDate: '2020-01-01', endDate: '2022-01-01', location: null, bullets: [] },
            { company: 'Acme Corp', title: 'Engineer', startDate: '2021-01-01', endDate: '2022-06-01', location: null, bullets: [] },
          ]),
        }),
      }),
    )
    expect(result.issues.join(' ')).toMatch(/duplicate/i)
  })

  it('flags a malformed link', () => {
    const result = analyzeRiskConsistency(
      buildTestInput({
        resume: buildTestResume({
          contact: buildContactInformation({
            name: 'Jordan Rivera',
            email: 'jordan@example.com',
            phone: null,
            location: null,
            links: [{ type: 'portfolio', url: 'not a url' }],
          }),
        }),
      }),
    )
    expect(result.issues.join(' ')).toMatch(/valid URLs/i)
  })

  it('does not flag two non-overlapping stints at the same company', () => {
    const result = analyzeRiskConsistency(
      buildTestInput({
        resume: buildTestResume({
          experience: buildExperienceEntries([
            { company: 'Acme Corp', title: 'Engineer', startDate: '2018-01-01', endDate: '2019-01-01', location: null, bullets: [] },
            { company: 'Acme Corp', title: 'Senior Engineer', startDate: '2020-01-01', endDate: '2022-01-01', location: null, bullets: [] },
          ]),
        }),
      }),
    )
    expect(result.score).toBe(100)
  })
})
