import { describe, expect, it } from 'vitest'
import { bulletImpactRecommendations } from './bulletImpactRecommendations'
import { buildTestResume } from '@/lib/ats/testFixtures'
import { buildExperienceEntries } from '@/lib/schema/resumeBuilders'

describe('bulletImpactRecommendations', () => {
  it('flags a vague bullet with no action verb or metric', () => {
    const resume = buildTestResume({
      experience: buildExperienceEntries([
        { company: 'Acme', title: 'Engineer', startDate: null, endDate: null, location: null, bullets: ['Responsible for various tasks.'] },
      ]),
    })
    const [recommendation] = bulletImpactRecommendations(resume)
    expect(recommendation?.currentText).toBe('Responsible for various tasks.')
    expect(recommendation?.guidance).toContain('truthful')
  })

  it('does not flag a bullet that already has an action verb and a metric', () => {
    const resume = buildTestResume({
      experience: buildExperienceEntries([
        { company: 'Acme', title: 'Engineer', startDate: null, endDate: null, location: null, bullets: ['Reduced load time by 35%.'] },
      ]),
    })
    expect(bulletImpactRecommendations(resume)).toEqual([])
  })

  it('never proposes replacement wording with invented numbers', () => {
    const resume = buildTestResume({
      experience: buildExperienceEntries([
        { company: 'Acme', title: 'Engineer', startDate: null, endDate: null, location: null, bullets: ['Worked on the frontend.'] },
      ]),
    })
    const [recommendation] = bulletImpactRecommendations(resume)
    expect(recommendation?.guidance).not.toMatch(/\d/)
  })

  it('provides a directly-acceptable suggestedText when the bullet has a weak lead-in', () => {
    const resume = buildTestResume({
      experience: buildExperienceEntries([
        {
          company: 'Acme',
          title: 'Engineer',
          startDate: null,
          endDate: null,
          location: null,
          bullets: ['Responsible for managing a team of 5 engineers.'],
        },
      ]),
    })
    const [recommendation] = bulletImpactRecommendations(resume)
    expect(recommendation?.suggestedText).toBe('Managed a team of 5 engineers.')
  })

  it('falls back to the original bullet, verbatim, when there is no safe mechanical rewrite (e.g. a missing metric)', () => {
    const resume = buildTestResume({
      experience: buildExperienceEntries([
        { company: 'Acme', title: 'Engineer', startDate: null, endDate: null, location: null, bullets: ['Managed the frontend team.'] },
      ]),
    })
    const [recommendation] = bulletImpactRecommendations(resume)
    // Never null: the UI always has a concrete suggestion to show, even when
    // the only honest "fix" is no fix (no metric can be safely invented).
    expect(recommendation?.suggestedText).toBe('Managed the frontend team.')
  })

  it('rewrites a bare gerund opener with no lead-in phrase', () => {
    const resume = buildTestResume({
      experience: buildExperienceEntries([
        { company: 'Acme', title: 'Engineer', startDate: null, endDate: null, location: null, bullets: ['Managing a team of 5 engineers.'] },
      ]),
    })
    const [recommendation] = bulletImpactRecommendations(resume)
    expect(recommendation?.suggestedText).toBe('Managed a team of 5 engineers.')
  })

  it('drops a first-person "I" opener', () => {
    const resume = buildTestResume({
      experience: buildExperienceEntries([
        { company: 'Acme', title: 'Engineer', startDate: null, endDate: null, location: null, bullets: ['I led the migration to TypeScript.'] },
      ]),
    })
    const [recommendation] = bulletImpactRecommendations(resume)
    expect(recommendation?.suggestedText).toBe('Led the migration to TypeScript.')
  })

  it('every bullet-impact recommendation has a non-null suggestedText', () => {
    const resume = buildTestResume({
      experience: buildExperienceEntries([
        {
          company: 'Acme',
          title: 'Engineer',
          startDate: null,
          endDate: null,
          location: null,
          bullets: ['Worked on stuff.', 'Helped with the redesign.', 'Tasked with onboarding new hires.'],
        },
      ]),
    })
    for (const recommendation of bulletImpactRecommendations(resume)) {
      expect(recommendation.suggestedText).not.toBeNull()
      expect(recommendation.suggestedText!.length).toBeGreaterThan(0)
    }
  })
})
