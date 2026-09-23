import { describe, expect, it } from 'vitest'
import { analyzeContentQuality } from './contentQualityAnalyzer'
import { buildTestInput, buildTestResume } from './testFixtures'
import { buildExperienceEntries } from '@/lib/schema/resumeBuilders'

describe('analyzeContentQuality', () => {
  it('scores highly for bullets with action verbs, metrics, and a summary', () => {
    const result = analyzeContentQuality(buildTestInput())
    expect(result.score).toBeGreaterThanOrEqual(80)
  })

  it('scores low for vague, unquantified bullets with no summary', () => {
    const resume = buildTestResume({
      summary: null,
      experience: buildExperienceEntries([
        {
          company: 'Acme',
          title: 'Engineer',
          startDate: null,
          endDate: null,
          location: null,
          bullets: ['Responsible for various tasks.', 'Worked with the team.'],
        },
      ]),
    })
    const result = analyzeContentQuality(buildTestInput({ resume }))
    expect(result.score).toBeLessThan(30)
    expect(result.issues).toContain('No professional summary was found.')
  })

  it('handles a resume with no bullets at all without crashing', () => {
    const resume = buildTestResume({ experience: [], summary: null })
    const result = analyzeContentQuality(buildTestInput({ resume }))
    expect(result.score).toBe(0)
  })
})
