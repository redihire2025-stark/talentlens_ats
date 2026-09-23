import { describe, expect, it } from 'vitest'
import { acceptSuggestion, rejectSuggestion } from './suggestions'
import { generateRecommendations } from '@/lib/recommendations/generateRecommendations'
import { buildTestResume } from '@/lib/ats/testFixtures'

function buildResumeWithBullet() {
  return buildTestResume({
    summary: null,
    experience: [
      { company: 'Acme', title: 'Engineer', startDate: '2020-01-01', endDate: null, location: null, bullets: ['Worked on stuff.'] },
    ],
  })
}

describe('acceptSuggestion', () => {
  it('applies the recommendation-provided suggestedText and marks it accepted', async () => {
    const resume = buildResumeWithBullet()
    const [bulletRec] = generateRecommendations({ resume, parserWarnings: [] }).filter((r) => r.category === 'bullet-impact')
    const result = await acceptSuggestion({ resume, recommendation: bulletRec! })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.status).toBe('accepted')
  })

  it('marks it "edited" when the caller supplies their own replacement text', async () => {
    const resume = buildResumeWithBullet()
    const [bulletRec] = generateRecommendations({ resume, parserWarnings: [] }).filter((r) => r.category === 'bullet-impact')
    const result = await acceptSuggestion({ resume, recommendation: bulletRec!, editedText: 'A hand-written replacement.' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.status).toBe('edited')
    expect(result.data.resume.experience[0]!.bullets[0]).toBe('A hand-written replacement.')
  })

  it('rejects a request missing the recommendation', async () => {
    // @ts-expect-error intentionally invalid request
    const result = await acceptSuggestion({ resume: buildResumeWithBullet() })
    expect(result.ok).toBe(false)
  })
})

describe('rejectSuggestion', () => {
  it('never touches the resume — it only records rejection', async () => {
    const result = await rejectSuggestion({ recommendationId: 'bullet-impact-0-0' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.status).toBe('rejected')
  })
})
