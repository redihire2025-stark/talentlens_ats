import { describe, expect, it } from 'vitest'
import { generateRecommendations } from './generateRecommendations'
import { buildTestResume } from '@/lib/ats/testFixtures'
import { matchResume } from '@/lib/matching/matchResume'
import { buildTestMatchInput } from '@/lib/matching/testFixtures'
import { explicitEvidence } from '@/lib/schema/evidence'
import { buildExperienceEntries } from '@/lib/schema/resumeBuilders'

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
      experience: buildExperienceEntries([{ company: 'Acme', title: 'Engineer', startDate: null, endDate: null, location: null, bullets: ['Worked on stuff.'] }]),
    })
    const recommendations = generateRecommendations({ resume, parserWarnings: [] })
    const bulletRec = recommendations.find((r) => r.category === 'bullet-impact')
    expect(bulletRec?.currentText).toBe('Worked on stuff.')
  })

  it('every recommendation carries the PRD §15 fields, defaulted correctly', () => {
    const resume = buildTestResume({ summary: null })
    const recommendations = generateRecommendations({ resume, parserWarnings: [] })
    expect(recommendations.length).toBeGreaterThan(0)
    for (const rec of recommendations) {
      expect(rec.status).toBe('pending')
      expect(rec.source).toBe('deterministic')
      expect(rec.confidence).toBe(1)
      expect(rec.issue).toBe(rec.title)
      expect(rec.explanation).toBe(rec.guidance)
      expect(rec.suggestedChange).toBe(rec.suggestedText)
      expect(rec.requiresUserInput).toBe(rec.suggestedText === null)
      expect(['high', 'medium', 'low']).toContain(rec.severity)
      // Evidence is typed; whenever a recommendation quotes the resume, that quote is its first piece of evidence.
      if (rec.currentText) expect(rec.evidence[0]?.text).toBe(rec.currentText)
      for (const e of rec.evidence) {
        expect(['explicit', 'inferred-from-structure']).toContain(e.sourceType)
        expect(e.confidence).toBeGreaterThan(0)
      }
    }
  })

  it('gives a bullet-impact recommendation evidence pointing at the exact experience entry', () => {
    const resume = buildTestResume({
      experience: buildExperienceEntries([{ company: 'Acme', title: 'Engineer', startDate: null, endDate: null, location: null, bullets: ['Worked on stuff.'] }]),
    })
    const bulletRec = generateRecommendations({ resume, parserWarnings: [] }).find((r) => r.category === 'bullet-impact')!
    expect(bulletRec.id).toBe('bullet-impact-exp-0-bullet-0')
    expect(bulletRec.evidence).toEqual([explicitEvidence('Worked on stuff.', 'experience', 'exp-0')])
    expect(bulletRec.location).toEqual({ section: 'experience', entryIndex: 0, bulletIndex: 0, entryId: 'exp-0', bulletId: 'exp-0-bullet-0' })
  })

  it('gives JD-gap recommendations evidence only where the resume actually shows something', () => {
    const input = buildTestMatchInput()
    const recommendations = generateRecommendations({ resume: input.resume, parserWarnings: [], matchAnalysis: matchResume(input) })
    const docker = recommendations.find((r) => r.id === 'skill-gap-req-required-2')!
    expect(docker.title).toContain('docker')
    expect(docker.evidence).toEqual([])
    const missingSection = recommendations.filter((r) => r.category === 'missing-section')
    for (const rec of missingSection) expect(rec.evidence).toEqual([])
  })
})
