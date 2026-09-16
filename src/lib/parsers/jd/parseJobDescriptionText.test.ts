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
