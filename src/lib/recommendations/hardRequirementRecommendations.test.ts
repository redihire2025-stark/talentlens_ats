import { describe, expect, it } from 'vitest'
import { hardRequirementRecommendations } from './hardRequirementRecommendations'
import { matchResume } from '@/lib/matching/matchResume'
import { buildTestMatchInput, buildTestJobDescription, buildTestResume } from '@/lib/matching/testFixtures'
import { buildContactInformation } from '@/lib/schema/resumeBuilders'

describe('hardRequirementRecommendations', () => {
  it('recommends against every unsatisfied hard requirement', () => {
    const analysis = matchResume(buildTestMatchInput())
    const recommendations = hardRequirementRecommendations(analysis)
    // Docker is a required skill with no evidence -> one hard-requirement-gap.
    expect(recommendations.some((r) => r.title.includes('Docker'))).toBe(true)
    expect(recommendations.every((r) => r.category === 'hard-requirement-gap')).toBe(true)
  })

  it('never recommends anything for a satisfied hard requirement', () => {
    const analysis = matchResume(buildTestMatchInput())
    const recommendations = hardRequirementRecommendations(analysis)
    expect(recommendations.some((r) => r.title.includes('React'))).toBe(false)
  })

  it('gives hard-requirement gaps the highest configured impact', () => {
    const analysis = matchResume(buildTestMatchInput())
    const recommendations = hardRequirementRecommendations(analysis)
    expect(recommendations[0]?.impact.delta).toBeGreaterThanOrEqual(8)
  })

  it('gives a location gap guidance that never asks the user to change resume content', () => {
    const analysis = matchResume(buildTestMatchInput({ jobDescription: buildTestJobDescription({ location: 'Seattle, WA' }) }))
    const location = hardRequirementRecommendations(analysis).find((r) => r.id === 'hard-requirement-gap-hard-requirement-location')!
    expect(location.guidance).toContain("isn't something to change on the resume")
    expect(location.currentText).toBeNull()
    expect(location.evidence).toEqual([])
  })

  it('gives an unmet education requirement credential-specific guidance with the matcher\'s evidence', () => {
    const analysis = matchResume(
      buildTestMatchInput({
        resume: buildTestResume({ education: [], contact: buildContactInformation({ name: 'J', email: null, phone: null, location: 'Austin, TX' }) }),
      }),
    )
    const education = hardRequirementRecommendations(analysis).find((r) => r.title.includes("Bachelor's degree"))!
    expect(education.guidance).toContain('never claim a credential')
    // Only structural evidence exists (work experience, no degree) — so there's no literal quote to show as currentText.
    expect(education.currentText).toBeNull()
    expect(education.evidence![0]!.sourceType).toBe('inferred-from-structure')
  })
})
