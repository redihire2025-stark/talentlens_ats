import { describe, expect, it } from 'vitest'
import { generateRecommendations } from './generateRecommendations'
import { buildTestResume } from '@/lib/ats/testFixtures'
import { matchResume } from '@/lib/matching/matchResume'
import { buildTestMatchInput } from '@/lib/matching/testFixtures'

describe('generateRecommendations', () => {
  it('runs resume-only generators without a job description', () => {
    const resume = buildTestResume({ summary: null })
    const recommendations = generateRecommendations({ resume, parserWarnings: [] })
    expect(recommendations.some((r) => r.category === 'missing-section')).toBe(true)
    expect(recommendations.some((r) => r.category === 'skill-not-demonstrated')).toBe(false)
  })

  it('includes JD-dependent recommendations only when a match analysis is provided', () => {
    const input = buildTestMatchInput()
    const analysis = matchResume(input)
    const recommendations = generateRecommendations({ resume: input.resume, parserWarnings: [], matchAnalysis: analysis })
    expect(recommendations.some((r) => r.category === 'skill-not-demonstrated')).toBe(true)
  })

  it('is deterministic for the same input', () => {
    const resume = buildTestResume()
    expect(generateRecommendations({ resume, parserWarnings: [] })).toEqual(generateRecommendations({ resume, parserWarnings: [] }))
  })

  it('a bullet-impact recommendation quotes the resume verbatim, never a rewritten version', () => {
    const resume = buildTestResume({
      experience: [{ company: 'Acme', title: 'Engineer', startDate: null, endDate: null, location: null, bullets: ['Worked on stuff.'] }],
    })
    const recommendations = generateRecommendations({ resume, parserWarnings: [] })
    const bulletRec = recommendations.find((r) => r.category === 'bullet-impact')
    expect(bulletRec?.currentText).toBe('Worked on stuff.')
  })
})
