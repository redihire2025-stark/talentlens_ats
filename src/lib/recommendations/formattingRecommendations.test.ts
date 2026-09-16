import { describe, expect, it } from 'vitest'
import { formattingRecommendations } from './formattingRecommendations'
import { buildTestResume } from '@/lib/ats/testFixtures'

describe('formattingRecommendations', () => {
  it('flags an experience entry with no bullet points', () => {
    const resume = buildTestResume({
      experience: [{ company: 'Acme', title: 'Baker', startDate: null, endDate: null, location: null, bullets: [] }],
    })
    const [recommendation] = formattingRecommendations(resume)
    expect(recommendation?.title).toContain('Acme')
  })

  it('does not flag an entry that already has bullets', () => {
    expect(formattingRecommendations(buildTestResume())).toEqual([])
  })
})
