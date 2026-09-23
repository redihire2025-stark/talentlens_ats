import { describe, expect, it } from 'vitest'
import { detectHardRequirements } from './hardRequirements'
import { matchResume } from './matchResume'
import { buildTestMatchInput } from './testFixtures'

describe('detectHardRequirements', () => {
  it('reports one minimum-experience requirement and one per required skill', () => {
    const input = buildTestMatchInput()
    const analysis = matchResume(input)
    const requirements = detectHardRequirements(input, analysis)

    const experienceReq = requirements.find((r) => r.type === 'minimum-experience')
    expect(experienceReq).toBeDefined()
    expect(experienceReq?.satisfied).toBe(true)

    const skillReqs = requirements.filter((r) => r.type === 'required-skill')
    expect(skillReqs).toHaveLength(3) // React, TypeScript, Docker
    const docker = skillReqs.find((r) => r.requirementText === 'Docker')
    expect(docker?.satisfied).toBe(false)
    expect(docker?.evidence).toEqual([])
    const react = skillReqs.find((r) => r.requirementText === 'React')
    expect(react?.satisfied).toBe(true)
    expect(react?.evidence.length).toBeGreaterThan(0)
  })

  it('omits a minimum-experience requirement when the JD does not state one', () => {
    const input = buildTestMatchInput({ jobDescription: { ...buildTestMatchInput().jobDescription, experience: { minimumYears: null, maximumYears: null } } })
    const analysis = matchResume(input)
    const requirements = detectHardRequirements(input, analysis)
    expect(requirements.some((r) => r.type === 'minimum-experience')).toBe(false)
  })

  it('never fabricates satisfaction for an unmatched required skill', () => {
    const input = buildTestMatchInput({ jobDescription: { ...buildTestMatchInput().jobDescription, requiredSkills: ['Kubernetes'] } })
    const analysis = matchResume(input)
    const requirements = detectHardRequirements(input, analysis)
    const kubernetes = requirements.find((r) => r.requirementText === 'Kubernetes')
    expect(kubernetes?.satisfied).toBe(false)
    expect(kubernetes?.reason).toContain('No evidence')
  })

  it('is exposed on MatchAnalysis via matchResume', () => {
    const result = matchResume(buildTestMatchInput())
    expect(result.hardRequirements.length).toBeGreaterThan(0)
  })
})
