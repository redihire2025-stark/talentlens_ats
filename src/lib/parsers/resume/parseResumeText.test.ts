import { describe, expect, it } from 'vitest'
import { parseResumeText } from './parseResumeText'

const SAMPLE_RESUME = `
Jordan Rivera
Austin, TX
jordan.rivera@example.com | 555-010-1234
https://github.com/jordanrivera

Summary
Frontend engineer with 6 years of experience building React applications.

Technical Skills
Languages: JavaScript, TypeScript
Frameworks: React, Next.js

Work Experience
Frontend Engineer, Acme Corp | Remote | Mar 2021 - Present
- Built reusable React components used across 4 production applications.
- Led migration from JavaScript to TypeScript across the frontend codebase.

Software Engineer, Beta Inc | Austin, TX | Jun 2018 - Feb 2021
- Implemented REST API integrations for the customer dashboard.

Education
University of Texas, B.S. in Computer Science, Austin, TX | 2015 - 2019

Certifications
AWS Certified Solutions Architect - Amazon Web Services (2022)

Projects
Resume Analyzer - A tool that scores resumes against job descriptions
Technologies: React, Node.js
- Built a scoring engine from scratch.
https://github.com/jordanrivera/resume-analyzer
`

describe('parseResumeText', () => {
  const { resume, warnings } = parseResumeText(SAMPLE_RESUME)

  it('extracts candidate contact info', () => {
    expect(resume.candidate.name).toBe('Jordan Rivera')
    expect(resume.candidate.email).toBe('jordan.rivera@example.com')
    expect(resume.candidate.phone).toBe('555-010-1234')
    expect(resume.candidate.location).toBe('Austin, TX')
    expect(resume.candidate.links).toEqual([{ type: 'github', url: 'https://github.com/jordanrivera' }])
  })

  it('extracts the summary', () => {
    expect(resume.summary).toContain('Frontend engineer with 6 years')
  })

  it('extracts labeled skills with a category derived from the label', () => {
    expect(resume.skills).toContainEqual(
      expect.objectContaining({ name: 'JavaScript', category: 'language' }),
    )
    expect(resume.skills).toContainEqual(
      expect.objectContaining({ name: 'React', category: 'framework' }),
    )
  })

  it('extracts multiple experience entries with title, company, dates, and bullets', () => {
    expect(resume.experience).toHaveLength(2)

    const current = resume.experience[0]!
    expect(current.title).toBe('Frontend Engineer')
    expect(current.company).toBe('Acme Corp')
    expect(current.startDate).toBe('2021-03-01')
    expect(current.endDate).toBeNull() // "Present" → ongoing
    expect(current.bullets).toEqual([
      'Built reusable React components used across 4 production applications.',
      'Led migration from JavaScript to TypeScript across the frontend codebase.',
    ])

    const previous = resume.experience[1]!
    expect(previous.title).toBe('Software Engineer')
    expect(previous.company).toBe('Beta Inc')
    expect(previous.endDate).toBe('2021-02-01')
  })

  it('extracts education with degree and field of study split out', () => {
    expect(resume.education).toHaveLength(1)
    const entry = resume.education[0]!
    expect(entry.institution).toBe('University of Texas')
    expect(entry.degree).toContain('B.S.')
    expect(entry.fieldOfStudy).toBe('Computer Science')
    expect(entry.startDate).toBe('2015-01-01')
    expect(entry.endDate).toBe('2019-01-01')
  })

  it('extracts certifications with issuer and issue date', () => {
    expect(resume.certifications).toEqual([
      { name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services', issueDate: '2022-01-01', expirationDate: null },
    ])
  })

  it('extracts projects with description, technologies, bullets, and url', () => {
    expect(resume.projects).toHaveLength(1)
    const project = resume.projects[0]!
    expect(project.name).toBe('Resume Analyzer')
    expect(project.description).toBe('A tool that scores resumes against job descriptions')
    expect(project.technologies).toEqual(['React', 'Node.js'])
    expect(project.bullets).toEqual(['Built a scoring engine from scratch.'])
    expect(project.url).toBe('https://github.com/jordanrivera/resume-analyzer')
  })

  it('produces no warnings for a well-formed resume', () => {
    expect(warnings).toEqual([])
  })
})

describe('parseResumeText with DOCX-shaped input', () => {
  // mammoth's extractRawText inserts a blank line after every paragraph
  // (bullets included), unlike the mostly-clean line breaks pdf.js
  // produces. This regression-tests the fix in dateBoundaryBlocks.ts.
  const MAMMOTH_STYLE_RESUME = [
    'Jordan Rivera',
    '',
    'jordan.rivera@example.com',
    '',
    'Work Experience',
    '',
    'Frontend Engineer, Acme Corp | Mar 2021 - Present',
    '',
    '- Built reusable React components used across 4 production applications.',
    '',
    '- Led migration from JavaScript to TypeScript across the frontend codebase.',
    '',
    'Software Engineer, Beta Inc | Jun 2018 - Feb 2021',
    '',
    '- Implemented REST API integrations for the customer dashboard.',
    '',
  ].join('\n')

  it('still groups bullets under the correct entry despite a blank line after every paragraph', () => {
    const { resume } = parseResumeText(MAMMOTH_STYLE_RESUME)
    expect(resume.experience).toHaveLength(2)
    expect(resume.experience[0]!.company).toBe('Acme Corp')
    expect(resume.experience[0]!.bullets).toHaveLength(2)
    expect(resume.experience[1]!.company).toBe('Beta Inc')
    expect(resume.experience[1]!.bullets).toHaveLength(1)
  })
})

describe('parseResumeText with a parenthesized date range', () => {
  it('does not leave a stray "()" glued onto the company name', () => {
    const text = [
      'Priya Nair',
      'priya.nair@example.com',
      '',
      'Work Experience',
      'Backend Engineer, Nimbus Systems  (2020-01 – Present)',
      '- Designed microservices.',
    ].join('\n')

    const { resume } = parseResumeText(text)
    expect(resume.experience[0]!.company).toBe('Nimbus Systems')
    expect(resume.experience[0]!.title).toBe('Backend Engineer')
  })
})

describe('parseResumeText edge cases', () => {
  it('returns an empty resume with a warning when no text was extracted', () => {
    const { resume, warnings } = parseResumeText('   ')
    expect(resume.candidate.name).toBeNull()
    expect(resume.skills).toEqual([])
    expect(warnings).toContain('No text could be extracted from this document.')
  })

  it('warns when the document is very short', () => {
    const { warnings } = parseResumeText('Jordan Rivera\nCook')
    expect(warnings).toContain('This document is very short for a resume — parsing may be incomplete.')
  })

  it('warns but does not crash when an experience entry has no separator to split title from company', () => {
    const text = `Jordan Rivera\njordan@example.com\n\nWork Experience\nRan my own bakery for 2019 - 2021\n- Baked bread.\n`
    const { resume, warnings } = parseResumeText(text)
    expect(resume.experience).toHaveLength(1)
    expect(resume.experience[0]!.company).toBe('')
    expect(warnings.some((w) => w.includes("couldn't separate the title from the company"))).toBe(true)
  })

  it('never fabricates a skill, an employer, or contact info that is not in the source text', () => {
    const { resume } = parseResumeText('Jordan Rivera\n\nWork Experience\n\nEducation\n')
    expect(resume.skills).toEqual([])
    expect(resume.experience).toEqual([])
    expect(resume.candidate.email).toBeNull()
  })
})
