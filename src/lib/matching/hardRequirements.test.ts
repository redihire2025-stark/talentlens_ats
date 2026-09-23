import { describe, expect, it } from 'vitest'
import { detectHardRequirements } from './hardRequirements'
import { matchResume } from './matchResume'
import { buildTestMatchInput, buildTestJobDescription, buildTestResume } from './testFixtures'
import { buildContactInformation, buildEducationEntries } from '@/lib/schema/resumeBuilders'
import { explicitEvidence } from '@/lib/schema/evidence'
import { buildJobRequirement } from '@/lib/schema/jdBuilders'

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
    expect(react?.requirementId).toBe('req-required-0')
    expect(react?.id).toBe('hard-requirement-required-skill-req-required-0')
    expect(react?.evidence.every((e) => e.sourceType === 'explicit')).toBe(true)
  })

  it('backs a satisfied minimum-experience requirement with the dated entries it was computed from', () => {
    const input = buildTestMatchInput()
    const experienceReq = matchResume(input).hardRequirements.find((r) => r.type === 'minimum-experience')!
    expect(experienceReq.evidence[0]!.sourceType).toBe('inferred-from-structure')
    expect(experienceReq.evidence[1]).toEqual(explicitEvidence('Frontend Engineer, Acme Corp', 'experience', 'exp-0'))
  })

  it('omits a minimum-experience requirement when the JD does not state one', () => {
    const input = buildTestMatchInput({ jobDescription: buildTestJobDescription({ experience: { minimumYears: null, maximumYears: null } }) })
    const analysis = matchResume(input)
    const requirements = detectHardRequirements(input, analysis)
    expect(requirements.some((r) => r.type === 'minimum-experience')).toBe(false)
  })

  it('never fabricates satisfaction for an unmatched required skill', () => {
    const input = buildTestMatchInput({ jobDescription: buildTestJobDescription({ requiredSkills: ['Kubernetes'] }) })
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

  it('reports one education requirement per required JD education line, satisfied only on a real match', () => {
    const matched = matchResume(buildTestMatchInput()).hardRequirements.filter((r) => r.type === 'education')
    expect(matched).toHaveLength(1)
    expect(matched[0]).toMatchObject({ requirementId: 'edu-0', satisfied: true })
    expect(matched[0]!.evidence[0]!.section).toBe('education')

    const noDegree = matchResume(buildTestMatchInput({ resume: buildTestResume({ education: [] }) })).hardRequirements.find(
      (r) => r.type === 'education',
    )!
    // "or equivalent experience" + real experience is only a partial match — not a satisfied hard requirement, and the reason says why.
    expect(noDegree.satisfied).toBe(false)
    expect(noDegree.reason).toContain('equivalent experience')
  })

  it('does not treat a "preferred" education line as a hard requirement', () => {
    const input = buildTestMatchInput({
      jobDescription: buildTestJobDescription({
        education: [buildJobRequirement({ rawText: "Master's degree preferred", category: 'education', priority: 'preferred' }, 'edu-0')],
      }),
    })
    expect(matchResume(input).hardRequirements.some((r) => r.type === 'education')).toBe(false)
  })

  it('checks a stated location against the resume location', () => {
    const same = matchResume(buildTestMatchInput()).hardRequirements.find((r) => r.type === 'location')!
    expect(same).toMatchObject({ requirementText: 'Location: Austin, TX', satisfied: true })
    expect(same.evidence).toEqual([explicitEvidence('Austin, TX', 'contact')])

    const sameCityDifferentSpelling = matchResume(
      buildTestMatchInput({ jobDescription: buildTestJobDescription({ location: 'Austin, Texas' }) }),
    ).hardRequirements.find((r) => r.type === 'location')!
    expect(sameCityDifferentSpelling.satisfied).toBe(true)

    const elsewhere = matchResume(
      buildTestMatchInput({ jobDescription: buildTestJobDescription({ location: 'Seattle, WA' }) }),
    ).hardRequirements.find((r) => r.type === 'location')!
    expect(elsewhere.satisfied).toBe(false)
    expect(elsewhere.evidence).toEqual([])
    expect(elsewhere.reason).toContain('relocate')
  })

  it('reports an unknown resume location as unsatisfied rather than guessing', () => {
    const resume = buildTestResume({ contact: buildContactInformation({ name: 'J', email: 'j@example.com', phone: null, location: null }) })
    const req = matchResume(buildTestMatchInput({ resume })).hardRequirements.find((r) => r.type === 'location')!
    expect(req.satisfied).toBe(false)
    expect(req.reason).toContain('no location was found')
  })

  it('skips the location check for a remote role or a JD with no location', () => {
    for (const location of ['Remote', null]) {
      const input = buildTestMatchInput({ jobDescription: buildTestJobDescription({ location }) })
      expect(matchResume(input).hardRequirements.some((r) => r.type === 'location')).toBe(false)
    }
  })

  it('never detects certification, license, or work-authorization requirements (no reliable signal yet)', () => {
    const input = buildTestMatchInput({
      resume: buildTestResume({ education: buildEducationEntries([]) }),
      jobDescription: buildTestJobDescription({ certifications: ['AWS Certified Solutions Architect'] }),
    })
    const types = matchResume(input).hardRequirements.map((r) => r.type)
    expect(types).not.toContain('certification')
    expect(types).not.toContain('license')
    expect(types).not.toContain('work-authorization')
  })
})
