import { describe, expect, it } from 'vitest'
import { matchSkill } from './skillMatcher'
import { buildTestResume } from './testFixtures'

describe('matchSkill', () => {
  it('matches an exact skill', () => {
    expect(matchSkill('React', buildTestResume()).status).toBe('matched')
  })

  it('matches via a normalized/synonym variant', () => {
    const result = matchSkill('React.js', buildTestResume())
    expect(result.status).toBe('matched')
    expect(result.skill).toBe('react')
  })

  it('matches "RESTful API" against a bullet mentioning "REST API development"', () => {
    const result = matchSkill('RESTful API', buildTestResume())
    expect(result.status).toBe('matched')
  })

  it('reports a skill with no evidence anywhere as missing, never fabricating it', () => {
    const result = matchSkill('Docker', buildTestResume())
    expect(result.status).toBe('missing')
    expect(result.evidence).toEqual([])
  })

  it('does not consider a concept demonstrated merely because the words are vaguely similar', () => {
    const result = matchSkill('Kubernetes', buildTestResume())
    expect(result.status).toBe('missing')
  })

  it('includes the PRD §12 match-result shape: requirement, matchType, confidence, reason', () => {
    const matched = matchSkill('React', buildTestResume())
    expect(matched.requirement).toBe('React')
    expect(matched.matchType).toBe('exact')
    expect(matched.confidence).toBe(1)
    expect(matched.reason.length).toBeGreaterThan(0)

    const normalized = matchSkill('React.js', buildTestResume())
    expect(normalized.matchType).toBe('normalized')

    const missing = matchSkill('Docker', buildTestResume())
    expect(missing.matchType).toBe('none')
    expect(missing.confidence).toBe(1)
    expect(missing.reason).toContain('Docker')
  })
})
