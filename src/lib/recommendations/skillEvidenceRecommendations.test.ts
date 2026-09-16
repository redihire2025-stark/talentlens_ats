import { describe, expect, it } from 'vitest'
import { skillEvidenceRecommendations } from './skillEvidenceRecommendations'
import { buildTestResume } from '@/lib/ats/testFixtures'

describe('skillEvidenceRecommendations', () => {
  it('flags a skill with no supporting bullet', () => {
    const resume = buildTestResume({
      skills: [{ name: 'Docker', category: 'tool', evidence: ['Docker'] }],
      experience: [{ company: 'Acme', title: 'Engineer', startDate: null, endDate: null, location: null, bullets: ['Built things.'] }],
    })
    const [recommendation] = skillEvidenceRecommendations(resume)
    expect(recommendation?.title).toContain('Docker')
    expect(recommendation?.guidance).toContain('If you')
  })

  it('does not flag a skill that is demonstrated in a bullet', () => {
    // The fixture's "React" skill is mentioned in a bullet; "TypeScript" is not.
    const titles = skillEvidenceRecommendations(buildTestResume()).map((r) => r.title)
    expect(titles.some((t) => t.includes('React'))).toBe(false)
  })
})
