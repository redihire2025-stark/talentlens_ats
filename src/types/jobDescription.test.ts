import { describe, expect, it } from 'vitest'
import type { JobDescription } from './jobDescription'
import { buildJobRequirements, buildKeywords, emptyJobDescription } from '@/lib/schema/jdBuilders'

function buildJobDescription(overrides: Partial<JobDescription> = {}): JobDescription {
  const requiredSkills = buildJobRequirements(['React.js', 'typescript'], { category: 'skill', priority: 'required', idPrefix: 'req-required' })
  const preferredSkills = buildJobRequirements(['graphql'], { category: 'skill', priority: 'preferred', idPrefix: 'req-preferred' })
  return emptyJobDescription({
    id: 'jd-test',
    title: 'Senior Frontend Engineer',
    seniority: 'senior',
    experience: { minimumYears: 5, maximumYears: null },
    requiredSkills,
    preferredSkills,
    responsibilities: ['Build and maintain customer-facing web applications.'],
    education: buildJobRequirements(["Bachelor's degree in Computer Science or equivalent experience"], {
      category: 'education',
      priority: 'required',
      idPrefix: 'edu',
    }),
    location: 'Austin, TX',
    employmentType: 'full-time',
    keywords: buildKeywords(requiredSkills, preferredSkills),
    rawText: 'Senior Frontend Engineer. Build and maintain customer-facing web applications.',
    ...overrides,
  })
}

describe('JobDescription schema', () => {
  it('accepts a fully populated job description', () => {
    const jd = buildJobDescription()
    expect(jd.requiredSkills.map((r) => r.canonicalTerm)).toContain('react')
    expect(jd.experience.minimumYears).toBe(5)
  })

  it('types each requirement with raw text, canonical term, category, priority, and an id', () => {
    const jd = buildJobDescription()
    expect(jd.requiredSkills[0]).toEqual({
      id: 'req-required-0',
      rawText: 'React.js',
      canonicalTerm: 'react',
      category: 'skill',
      priority: 'required',
      confidence: 1,
    })
    expect(jd.preferredSkills[0]!.priority).toBe('preferred')
    expect(jd.keywords.map((k) => [k.id, k.canonicalTerm, k.category])).toEqual([
      ['kw-0', 'react', 'keyword'],
      ['kw-1', 'typescript', 'keyword'],
      ['kw-2', 'graphql', 'keyword'],
    ])
  })

  it('allows an open-ended experience range with a null maximum', () => {
    const jd = buildJobDescription({ experience: { minimumYears: 3, maximumYears: null } })
    expect(jd.experience.maximumYears).toBeNull()
  })

  it('allows an unspecified title, location, or employment type rather than a guessed value', () => {
    const jd = buildJobDescription({ title: null, location: null, employmentType: null })
    expect(jd.title).toBeNull()
    expect(jd.employmentType).toBeNull()
  })
})
