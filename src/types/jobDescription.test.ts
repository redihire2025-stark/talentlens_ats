import { describe, expect, it } from 'vitest'
import type { JobDescription } from './jobDescription'

function buildJobDescription(overrides: Partial<JobDescription> = {}): JobDescription {
  return {
    title: 'Senior Frontend Engineer',
    experience: { minimumYears: 5, maximumYears: null },
    requiredSkills: ['react', 'typescript'],
    preferredSkills: ['graphql'],
    responsibilities: ['Build and maintain customer-facing web applications.'],
    education: ["Bachelor's degree in Computer Science or equivalent experience"],
    certifications: [],
    location: 'Austin, TX',
    employmentType: 'full-time',
    keywords: ['react', 'typescript', 'frontend'],
    ...overrides,
  }
}

describe('JobDescription schema', () => {
  it('accepts a fully populated job description', () => {
    const jd = buildJobDescription()
    expect(jd.requiredSkills).toContain('react')
    expect(jd.experience.minimumYears).toBe(5)
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
