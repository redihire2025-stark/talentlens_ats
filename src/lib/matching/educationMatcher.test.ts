import { describe, expect, it } from 'vitest'
import { matchEducation } from './educationMatcher'
import { buildTestMatchInput, buildTestResume } from './testFixtures'
import { explicitEvidence, structuralEvidence } from '@/lib/schema/evidence'
import { buildEducationEntries } from '@/lib/schema/resumeBuilders'

describe('matchEducation', () => {
  it('matches when the resume degree field overlaps the requirement', () => {
    const result = matchEducation(buildTestMatchInput())
    expect(result.status).toBe('matched')
    expect(result.matchedRequirements).toHaveLength(1)
  })

  it('is not required when the JD lists no education requirements', () => {
    const result = matchEducation(
      buildTestMatchInput({ jobDescription: { ...buildTestMatchInput().jobDescription, education: [] } }),
    )
    expect(result.required).toBe(false)
    expect(result.status).toBe('matched')
  })

  it('treats a degree in an unrelated field as partial, not missing', () => {
    const resume = buildTestResume({
      education: buildEducationEntries([
        {
          institution: 'State University',
          degree: 'B.A. Fine Arts',
          fieldOfStudy: 'Fine Arts',
          startDate: null,
          endDate: null,
          location: null,
        },
      ]),
    })
    const result = matchEducation(buildTestMatchInput({ resume }))
    expect(result.status).toBe('partial')
  })

  it('allows "equivalent experience" to partially satisfy a missing degree', () => {
    const resume = buildTestResume({ education: [] })
    const result = matchEducation(buildTestMatchInput({ resume }))
    expect(result.status).toBe('partial')
  })

  it('reports missing when there is no degree and no experience to fall back on', () => {
    const resume = buildTestResume({ education: [], experience: [] })
    const result = matchEducation(buildTestMatchInput({ resume }))
    expect(result.status).toBe('missing')
  })

  it('returns a typed per-requirement result with id, evidence, and a reason', () => {
    const result = matchEducation(buildTestMatchInput())
    expect(result.requirements).toEqual([
      {
        requirementId: 'edu-0',
        requirement: "Bachelor's degree in Computer Science or equivalent experience",
        status: 'matched',
        evidence: [explicitEvidence('University of Texas, B.S. Computer Science, Computer Science', 'education', 'edu-0')],
        reason: "Your education (B.S. Computer Science, Computer Science) matches \"Bachelor's degree in Computer Science or equivalent experience\".",
      },
    ])
  })

  it('records equivalent-experience credit as structural evidence, not a fabricated quote', () => {
    const result = matchEducation(buildTestMatchInput({ resume: buildTestResume({ education: [] }) }))
    expect(result.requirements[0]!.evidence).toEqual([
      structuralEvidence('1 work experience entry listed; no degree listed.', 'experience'),
    ])
  })
})
