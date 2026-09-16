import { describe, expect, it } from 'vitest'
import { bulletImpactRecommendations } from './bulletImpactRecommendations'
import { buildTestResume } from '@/lib/ats/testFixtures'

describe('bulletImpactRecommendations', () => {
  it('flags a vague bullet with no action verb or metric', () => {
    const resume = buildTestResume({
      experience: [
        { company: 'Acme', title: 'Engineer', startDate: null, endDate: null, location: null, bullets: ['Responsible for various tasks.'] },
      ],
    })
    const [recommendation] = bulletImpactRecommendations(resume)
    expect(recommendation?.currentText).toBe('Responsible for various tasks.')
    expect(recommendation?.guidance).toContain('truthful')
  })

  it('does not flag a bullet that already has an action verb and a metric', () => {
    const resume = buildTestResume({
      experience: [
        { company: 'Acme', title: 'Engineer', startDate: null, endDate: null, location: null, bullets: ['Reduced load time by 35%.'] },
      ],
    })
    expect(bulletImpactRecommendations(resume)).toEqual([])
  })

  it('never proposes replacement wording with invented numbers', () => {
    const resume = buildTestResume({
      experience: [
        { company: 'Acme', title: 'Engineer', startDate: null, endDate: null, location: null, bullets: ['Worked on the frontend.'] },
      ],
    })
    const [recommendation] = bulletImpactRecommendations(resume)
    expect(recommendation?.guidance).not.toMatch(/\d/)
  })
})
