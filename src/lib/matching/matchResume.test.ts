import { describe, expect, it } from 'vitest'
import { matchResume } from './matchResume'
import { buildTestMatchInput } from './testFixtures'

describe('matchResume', () => {
  it('runs every matcher and assembles a complete MatchAnalysis', () => {
    const result = matchResume(buildTestMatchInput())

    expect(result.skills.required).toHaveLength(3) // React, TypeScript, Docker
    expect(result.skills.preferred).toHaveLength(1) // GraphQL
    expect(result.title.status).toBe('matched')
    expect(result.experience.status).toBe('matched')
    expect(result.education.status).toBe('matched')
    expect(result.responsibilities).toHaveLength(1)
  })

  it('is deterministic: the same input always produces the same analysis', () => {
    const input = buildTestMatchInput()
    expect(matchResume(input)).toEqual(matchResume(input))
  })

  it('correctly separates matched, missing, and partial required skills', () => {
    const result = matchResume(buildTestMatchInput())
    const byStatus = Object.fromEntries(result.skills.required.map((s) => [s.normalizedTerm, s.status]))
    expect(byStatus['react']).toBe('matched')
    expect(byStatus['typescript']).toBe('matched')
    expect(byStatus['docker']).toBe('missing')
  })
})
