import { describe, expect, it } from 'vitest'
import { missingSectionRecommendations } from './missingSectionRecommendations'
import { buildTestResume } from '@/lib/ats/testFixtures'

describe('missingSectionRecommendations', () => {
  it('returns nothing for a resume with every section present', () => {
    expect(missingSectionRecommendations({ resume: buildTestResume(), parserWarnings: [] })).toEqual([])
  })

  it('recommends adding a missing summary without inventing one', () => {
    const resume = buildTestResume({ summary: null })
    const [recommendation] = missingSectionRecommendations({ resume, parserWarnings: [] })
    expect(recommendation?.title).toBe('Add: Summary')
    expect(recommendation?.currentText).toBeNull()
  })

  it('recommends every missing section for an empty resume', () => {
    const resume = buildTestResume({
      candidate: { name: null, email: null, phone: null, location: null, links: [] },
      summary: null,
      skills: [],
      experience: [],
      education: [],
    })
    const recommendations = missingSectionRecommendations({ resume, parserWarnings: [] })
    expect(recommendations.length).toBeGreaterThanOrEqual(5)
  })
})
