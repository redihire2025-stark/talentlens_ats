import { describe, expect, it } from 'vitest'
import { titleAlignmentRecommendations } from './titleAlignmentRecommendations'
import { matchResume } from '@/lib/matching/matchResume'
import { buildTestMatchInput, buildTestJobDescription } from '@/lib/matching/testFixtures'

describe('titleAlignmentRecommendations', () => {
  it('recommends reviewing title framing when titles do not match', () => {
    const analysis = matchResume(buildTestMatchInput({ jobDescription: buildTestJobDescription({ title: 'Data Scientist' }) }))
    const [recommendation] = titleAlignmentRecommendations(analysis)
    expect(recommendation?.currentText).toBe('Frontend Engineer')
    expect(recommendation?.guidance).toContain('genuinely held')
  })

  it('returns nothing when the title already matches', () => {
    const analysis = matchResume(buildTestMatchInput())
    expect(titleAlignmentRecommendations(analysis)).toEqual([])
  })

  it('returns nothing when the JD did not state a title', () => {
    const analysis = matchResume(buildTestMatchInput({ jobDescription: buildTestJobDescription({ title: null }) }))
    expect(titleAlignmentRecommendations(analysis)).toEqual([])
  })
})
