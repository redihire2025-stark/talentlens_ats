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
    expect(jobDescription.requiredSkills.map((r) => r.rawText)).toEqual(['React', 'TypeScript', 'Node.js'])
    expect(jobDescription.preferredSkills.map((r) => r.rawText)).toEqual(['GraphQL', 'Docker'])
  })

  it('types each skill requirement with an id, raw text, canonical term, priority, confidence, and its source line', () => {
    expect(jobDescription.requiredSkills[2]).toEqual({
      id: 'req-required-2',
      rawText: 'Node.js',
      canonicalTerm: 'node.js',
      category: 'skill',
      priority: 'required',
      evidence: 'Required Skills: React, TypeScript, Node.js',
      confidence: 1,
    })
    expect(jobDescription.preferredSkills.map((r) => [r.id, r.priority])).toEqual([
      ['req-preferred-0', 'preferred'],
      ['req-preferred-1', 'preferred'],
    ])
  })

  it('attaches a years figure stated on the same line as a requirement term', () => {
    // "5+ years of experience with React" names React — the listed React requirement gets minimumYears 5.
    expect(jobDescription.requiredSkills[0]!.minimumYears).toBe(5)
    expect(jobDescription.requiredSkills[1]).not.toHaveProperty('minimumYears')
  })

  it('extracts responsibilities as full sentences, not split into fragments', () => {
    expect(jobDescription.responsibilities).toEqual([
      'Build and maintain customer-facing web applications.',
      'Collaborate with designers on new features.',
    ])
  })

  it('extracts education requirement lines as typed requirements', () => {
    expect(jobDescription.education).toEqual([
      {
        id: 'edu-0',
        rawText: "Bachelor's degree in Computer Science or equivalent experience",
        canonicalTerm: "bachelor's degree in computer science or equivalent experience",
        category: 'education',
        priority: 'required',
        confidence: 1,
      },
    ])
  })

  it('derives keywords as the union of required and preferred skills, deduplicated by canonical term', () => {
    expect(jobDescription.keywords.map((k) => k.canonicalTerm)).toEqual(['react', 'typescript', 'node.js', 'graphql', 'docker'])
    expect(jobDescription.keywords.map((k) => k.id)).toEqual(['kw-0', 'kw-1', 'kw-2', 'kw-3', 'kw-4'])
    expect(jobDescription.keywords.every((k) => k.category === 'keyword')).toBe(true)
    expect(jobDescription.keywords[3]!.priority).toBe('preferred')
  })

  it('produces no warnings for a well-formed JD', () => {
    expect(warnings).toEqual([])
    expect(jobDescription.parserWarnings).toEqual([])
  })

  it('has a content-derived id and is fully deterministic', () => {
    expect(jobDescription.id).toMatch(/^jd-[0-9a-f]{8}$/)
    expect(parseJobDescriptionText(SAMPLE_JD)).toEqual(parseJobDescriptionText(SAMPLE_JD))
  })
})

describe('parseJobDescriptionText prose extraction (PRD §9 flagship fix)', () => {
  it('mines a skill mentioned only in a prose requirement sentence, not just list lines', () => {
    const { jobDescription } = parseJobDescriptionText(
      'Backend Engineer\n\nRequirements\n3+ years building production services with Kubernetes and PostgreSQL.\n\nResponsibilities\nOwn the deployment pipeline.',
    )
    expect(jobDescription.requiredSkills.map((r) => r.canonicalTerm)).toEqual(expect.arrayContaining(['kubernetes', 'postgresql']))
    const kubernetes = jobDescription.requiredSkills.find((r) => r.canonicalTerm === 'kubernetes')!
    expect(kubernetes).toEqual({
      id: 'req-required-1', // taxonomy order within one line: postgresql is req-required-0
      rawText: 'Kubernetes',
      canonicalTerm: 'kubernetes',
      category: 'skill',
      priority: 'required',
      minimumYears: 3,
      evidence: '3+ years building production services with Kubernetes and PostgreSQL.',
      confidence: 0.8,
    })
  })

  it('does not duplicate a listed skill when prose mentions a different spelling of it', () => {
    const { jobDescription } = parseJobDescriptionText('Engineer\n\nRequirements\nRequired Skills: React.js, Docker\nExperience shipping React to production.')
    expect(jobDescription.requiredSkills.map((r) => r.canonicalTerm)).toEqual(['react', 'docker'])
  })

  it('mines a technology mentioned only in a responsibilities sentence into `technologies`, not requiredSkills', () => {
    const { jobDescription } = parseJobDescriptionText(
      'Platform Engineer\n\nResponsibilities\nMaintain our Terraform-managed AWS infrastructure and Docker-based CI pipeline.\n\nRequirements\nRequired Skills: Linux, Bash',
    )
    expect(jobDescription.technologies.map((t) => t.canonicalTerm)).toEqual(expect.arrayContaining(['aws', 'docker']))
    expect(jobDescription.technologies.every((t) => t.category === 'technology' && t.priority === 'optional')).toBe(true)
    expect(jobDescription.requiredSkills.map((r) => r.canonicalTerm)).not.toContain('aws')
  })

  it('does not mine short, ambiguous tokens like "go" or "js" out of ordinary prose', () => {
    const { jobDescription } = parseJobDescriptionText(
      'Program Manager\n\nResponsibilities\nGo through the backlog and report status; js not required here.\n\nRequirements\nRequired Skills: Communication',
    )
    expect(jobDescription.technologies.map((t) => t.canonicalTerm)).not.toContain('go')
    expect(jobDescription.technologies.map((t) => t.canonicalTerm)).not.toContain('javascript')
  })

  it('extracts soft skills mentioned in prose', () => {
    const { jobDescription } = parseJobDescriptionText(
      'Team Lead\n\nResponsibilities\nStrong communication and leadership are essential for mentoring junior engineers.\n\nRequirements\nRequired Skills: React',
    )
    expect(jobDescription.softSkills.map((s) => s.canonicalTerm)).toEqual(expect.arrayContaining(['communication', 'leadership', 'mentoring']))
    // Stated under Responsibilities, not Requirements — a mention, not a stated requirement.
    expect(jobDescription.softSkills.every((s) => s.category === 'soft-skill' && s.priority === 'optional')).toBe(true)
  })

  it('extracts a seniority level from the title', () => {
    const { jobDescription } = parseJobDescriptionText(SAMPLE_JD)
    expect(jobDescription.seniority).toBe('senior')
  })

  it('extracts a repeated domain acronym but not a one-off or generic one', () => {
    const { jobDescription } = parseJobDescriptionText(
      'Compliance Engineer\n\nResponsibilities\nEnsure HIPAA compliance across services; review HIPAA controls quarterly.\n\nRequirements\nRequired Skills: Python\n\nOur CEO cares about this.',
    )
    expect(jobDescription.domainTerms.map((d) => d.rawText)).toContain('HIPAA')
    expect(jobDescription.domainTerms.map((d) => d.rawText)).not.toContain('CEO')
    expect(jobDescription.domainTerms[0]).toEqual({
      id: 'domain-0',
      rawText: 'HIPAA',
      canonicalTerm: 'hipaa',
      category: 'domain',
      priority: 'optional',
      confidence: 1,
    })
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
    expect(jobDescription.parserWarnings).toEqual(warnings)
  })

  it('marks an education line that says "preferred" as a preferred requirement', () => {
    const { jobDescription } = parseJobDescriptionText(
      "Data Analyst\n\nResponsibilities\n- Build dashboards.\n\nEducation\nMaster's degree preferred\nBachelor's degree in Statistics",
    )
    expect(jobDescription.education.map((e) => [e.id, e.priority])).toEqual([
      ['edu-0', 'preferred'],
      ['edu-1', 'required'],
    ])
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
