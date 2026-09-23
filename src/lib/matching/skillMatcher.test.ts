import { describe, expect, it } from 'vitest'
import { matchSkill } from './skillMatcher'
import { buildTestResume, testRequirement } from './testFixtures'
import { explicitEvidence } from '@/lib/schema/evidence'
import { buildResumeSkills } from '@/lib/schema/resumeBuilders'

describe('matchSkill', () => {
  it('matches an exact skill', () => {
    expect(matchSkill(testRequirement('React'), buildTestResume()).status).toBe('matched')
  })

  it('matches via a normalized/synonym variant', () => {
    const result = matchSkill(testRequirement('React.js'), buildTestResume())
    expect(result.status).toBe('matched')
    expect(result.normalizedTerm).toBe('react')
  })

  it('matches "RESTful API" against a bullet mentioning "REST API development"', () => {
    const result = matchSkill(testRequirement('RESTful API'), buildTestResume())
    expect(result.status).toBe('matched')
  })

  it('reports a skill with no evidence anywhere as missing, never fabricating it', () => {
    const result = matchSkill(testRequirement('Docker'), buildTestResume())
    expect(result.status).toBe('missing')
    expect(result.evidence).toEqual([])
  })

  it('does not consider a concept demonstrated merely because the words are vaguely similar', () => {
    const result = matchSkill(testRequirement('Kubernetes'), buildTestResume())
    expect(result.status).toBe('missing')
  })

  it('includes the PRD §12 match-result shape: requirement, matchType, confidence, reason', () => {
    const matched = matchSkill(testRequirement('React'), buildTestResume())
    expect(matched.requirement).toBe('React')
    expect(matched.matchType).toBe('exact')
    expect(matched.confidence).toBe(1)
    expect(matched.reason.length).toBeGreaterThan(0)

    const normalized = matchSkill(testRequirement('React.js'), buildTestResume())
    expect(normalized.matchType).toBe('normalized')

    const missing = matchSkill(testRequirement('Docker'), buildTestResume())
    expect(missing.matchType).toBe('none')
    expect(missing.confidence).toBe(1)
    expect(missing.reason).toContain('Docker')
  })

  it('carries the requirement id and typed evidence for each match layer', () => {
    const exact = matchSkill(testRequirement('React', 'req-required-0'), buildTestResume())
    expect(exact.requirementId).toBe('req-required-0')
    expect(exact.evidence[0]).toEqual(explicitEvidence('React', 'skills', 'skill-0'))
    // The skills-list skill is also linked to the bullet that demonstrates it.
    expect(exact.evidence[1]).toEqual(
      explicitEvidence('Built reusable React components used across 4 production applications.', 'experience', 'exp-0'),
    )

    const bullet = matchSkill(testRequirement('RESTful API'), buildTestResume())
    expect(bullet.matchType).toBe('synonym')
    expect(bullet.evidence).toEqual([
      explicitEvidence('Implemented REST API development for the customer dashboard.', 'experience', 'exp-0', 0.9),
    ])
  })

  it('quotes the related skill name, with the fuzzy confidence, for a partial match', () => {
    const resume = buildTestResume({ skills: buildResumeSkills([{ rawName: 'Amazon Redshift' }]) })
    const partial = matchSkill(testRequirement('Redshift Spectrum'), resume)
    expect(partial.status).toBe('partial')
    expect(partial.confidence).toBe(0.5)
    expect(partial.evidence).toEqual([explicitEvidence('Amazon Redshift', 'skills', 'skill-0', 0.5)])
  })
})
