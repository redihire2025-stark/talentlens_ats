import { describe, expect, it } from 'vitest'
import { parseJobDescriptionText } from './parseJobDescriptionText'

const SAMPLE_JD = `
Senior Frontend Engineer
Location: Austin, TX

This is a full-time role on our platform team.

Responsibilities
- Build and maintain customer-facing web applications.
- Collaborate with designers on new features.

Requirements
5+ years of experience with React
Required Skills: React, TypeScript, Node.js

Preferred Qualifications
Preferred Skills: GraphQL, Docker

Education
Bachelor's degree in Computer Science or equivalent experience
`

describe('parseJobDescriptionText', () => {
  const { jobDescription, warnings } = parseJobDescriptionText(SAMPLE_JD)

  it('extracts title, location, and employment type', () => {
    expect(jobDescription.title).toBe('Senior Frontend Engineer')
    expect(jobDescription.location).toBe('Austin, TX')
    expect(jobDescription.employmentType).toBe('full-time')
  })

  it('extracts an experience requirement', () => {
    expect(jobDescription.experience).toEqual({ minimumYears: 5, maximumYears: null })
  })

  it('extracts required and preferred skills from list-like lines', () => {
    expect(jobDescription.requiredSkills).toEqual(['React', 'TypeScript', 'Node.js'])
    expect(jobDescription.preferredSkills).toEqual(['GraphQL', 'Docker'])
  })

  it('extracts responsibilities as full sentences, not split into fragments', () => {
    expect(jobDescription.responsibilities).toEqual([
      'Build and maintain customer-facing web applications.',
      'Collaborate with designers on new features.',
    ])
  })

  it('extracts education requirement lines', () => {
    expect(jobDescription.education).toEqual(["Bachelor's degree in Computer Science or equivalent experience"])
  })

  it('derives keywords as the deduplicated, lowercased union of required and preferred skills', () => {
    expect(jobDescription.keywords).toEqual(['react', 'typescript', 'node.js', 'graphql', 'docker'])
  })

  it('produces no warnings for a well-formed JD', () => {
    expect(warnings).toEqual([])
  })
})

describe('parseJobDescriptionText prose extraction (PRD §9 flagship fix)', () => {
  it('mines a skill mentioned only in a prose requirement sentence, not just list lines', () => {
    const { jobDescription } = parseJobDescriptionText(
      'Backend Engineer\n\nRequirements\n3+ years building production services with Kubernetes and PostgreSQL.\n\nResponsibilities\nOwn the deployment pipeline.',
    )
    expect(jobDescription.requiredSkills).toEqual(expect.arrayContaining(['kubernetes', 'postgresql']))
  })

  it('mines a technology mentioned only in a responsibilities sentence into `technologies`, not requiredSkills', () => {
    const { jobDescription } = parseJobDescriptionText(
      'Platform Engineer\n\nResponsibilities\nMaintain our Terraform-managed AWS infrastructure and Docker-based CI pipeline.\n\nRequirements\nRequired Skills: Linux, Bash',
    )
    expect(jobDescription.technologies).toEqual(expect.arrayContaining(['aws', 'docker']))
    expect(jobDescription.requiredSkills).not.toContain('aws')
  })

  it('does not mine short, ambiguous tokens like "go" or "js" out of ordinary prose', () => {
    const { jobDescription } = parseJobDescriptionText(
      'Program Manager\n\nResponsibilities\nGo through the backlog and report status; js not required here.\n\nRequirements\nRequired Skills: Communication',
    )
    expect(jobDescription.technologies).not.toContain('go')
    expect(jobDescription.technologies).not.toContain('javascript')
  })

  it('extracts soft skills mentioned in prose', () => {
    const { jobDescription } = parseJobDescriptionText(
      'Team Lead\n\nResponsibilities\nStrong communication and leadership are essential for mentoring junior engineers.\n\nRequirements\nRequired Skills: React',
    )
    expect(jobDescription.softSkills).toEqual(expect.arrayContaining(['communication', 'leadership', 'mentoring']))
  })

  it('extracts a seniority level from the title', () => {
    const { jobDescription } = parseJobDescriptionText(SAMPLE_JD)
    expect(jobDescription.seniority).toBe('senior')
  })

  it('extracts a repeated domain acronym but not a one-off or generic one', () => {
    const { jobDescription } = parseJobDescriptionText(
      'Compliance Engineer\n\nResponsibilities\nEnsure HIPAA compliance across services; review HIPAA controls quarterly.\n\nRequirements\nRequired Skills: Python\n\nOur CEO cares about this.',
    )
    expect(jobDescription.domainTerms).toContain('HIPAA')
    expect(jobDescription.domainTerms).not.toContain('CEO')
  })

  it('keeps rawText equal to the trimmed source text', () => {
    const { jobDescription } = parseJobDescriptionText(SAMPLE_JD)
    expect(jobDescription.rawText).toBe(SAMPLE_JD.trim())
  })
})

describe('parseJobDescriptionText edge cases', () => {
  it('returns an empty job description with a warning when no text was extracted', () => {
    const { jobDescription, warnings } = parseJobDescriptionText('   ')
    expect(jobDescription.title).toBeNull()
    expect(jobDescription.requiredSkills).toEqual([])
    expect(warnings).toContain('No text could be extracted from this document.')
  })

  it('warns when the document is very short', () => {
    const { warnings } = parseJobDescriptionText('Engineer wanted.')
    expect(warnings).toContain('This document is very short for a job description — parsing may be incomplete.')
  })

  it('warns but does not crash when no skills or responsibilities are found', () => {
    const { jobDescription, warnings } = parseJobDescriptionText(
      'We are a growing company looking for talented people to join our mission-driven team here in the city.',
    )
    expect(jobDescription.requiredSkills).toEqual([])
    expect(warnings.some((w) => w.includes('No clearly listed skills'))).toBe(true)
    expect(warnings.some((w) => w.includes('No responsibilities section'))).toBe(true)
  })

  it('never fabricates a skill or requirement that is not in the source text', () => {
    const { jobDescription } = parseJobDescriptionText('Senior Engineer\n\nResponsibilities\n\nRequirements\n')
    expect(jobDescription.requiredSkills).toEqual([])
    expect(jobDescription.responsibilities).toEqual([])
  })
})
