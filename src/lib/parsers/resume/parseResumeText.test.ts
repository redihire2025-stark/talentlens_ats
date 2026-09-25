import { describe, expect, it } from 'vitest'
import { parseResumeText } from './parseResumeText'
import { explicitEvidence } from '@/lib/schema/evidence'

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
    expect(resume.contact.name).toBe('Jordan Rivera')
    expect(resume.contact.email).toBe('jordan.rivera@example.com')
    expect(resume.contact.phone).toBe('555-010-1234')
    expect(resume.contact.location).toBe('Austin, TX')
    expect(resume.contact.links).toEqual([{ type: 'github', url: 'https://github.com/jordanrivera' }])
  })

  it('quotes the header line each contact field came from as typed evidence', () => {
    expect(resume.contact.evidence).toEqual([
      explicitEvidence('Jordan Rivera', 'contact'),
      explicitEvidence('jordan.rivera@example.com | 555-010-1234', 'contact'),
      explicitEvidence('Austin, TX', 'contact'),
      explicitEvidence('https://github.com/jordanrivera', 'contact'),
    ])
  })

  it('extracts the summary', () => {
    expect(resume.summary).toContain('Frontend engineer with 6 years')
  })

  it('extracts labeled skills with a category derived from the label', () => {
    expect(resume.skills).toContainEqual(
      expect.objectContaining({ rawName: 'JavaScript', canonicalName: 'javascript', category: 'language' }),
    )
    expect(resume.skills).toContainEqual(
      expect.objectContaining({ rawName: 'React', canonicalName: 'react', category: 'framework' }),
    )
  })

  it('gives each skill a positional id, the raw and canonical name, and typed evidence from the list line and any bullet', () => {
    const nextJs = resume.skills.find((s) => s.rawName === 'Next.js')!
    expect(nextJs.id).toBe('skill-3')
    expect(nextJs.canonicalName).toBe('next.js')
    expect(nextJs.sources).toEqual(['skills-section'])
    expect(nextJs.evidence).toEqual([explicitEvidence('Frameworks: React, Next.js', 'skills', 'skill-3')])

    const typescript = resume.skills.find((s) => s.rawName === 'TypeScript')!
    expect(typescript.sources).toEqual(['skills-section', 'experience'])
    expect(typescript.evidence).toEqual([
      explicitEvidence('Languages: JavaScript, TypeScript', 'skills', 'skill-1'),
      explicitEvidence('Led migration from JavaScript to TypeScript across the frontend codebase.', 'experience', 'exp-0'),
    ])

    const react = resume.skills.find((s) => s.rawName === 'React')!
    expect(react.sources).toEqual(['skills-section', 'experience']) // the project's bullet doesn't name React; its Technologies line isn't a bullet
  })

  it('extracts multiple experience entries with title, company, dates, and bullets', () => {
    expect(resume.experience).toHaveLength(2)

    const current = resume.experience[0]!
    expect(current.title).toBe('Frontend Engineer')
    expect(current.company).toBe('Acme Corp')
    expect(current.startDate).toBe('2021-03-01')
    expect(current.endDate).toBeNull() // "Present" → ongoing
    expect(current.isCurrent).toBe(true)
    expect(current.bullets.map((b) => b.text)).toEqual([
      'Built reusable React components used across 4 production applications.',
      'Led migration from JavaScript to TypeScript across the frontend codebase.',
    ])

    const previous = resume.experience[1]!
    expect(previous.title).toBe('Software Engineer')
    expect(previous.company).toBe('Beta Inc')
    expect(previous.endDate).toBe('2021-02-01')
    expect(previous.isCurrent).toBe(false)
  })

  it('builds each bullet as its own entity with id, action verb, metrics, technologies, and evidence', () => {
    const [first, second] = resume.experience[0]!.bullets
    expect(first!.id).toBe('exp-0-bullet-0')
    expect(first!.actionVerb).toBe('built')
    expect(first!.metrics).toEqual([{ text: '4', value: 4, kind: 'count' }])
    expect(first!.technologies.map((t) => t.canonicalName)).toEqual(['react'])
    expect(first!.achievements).toEqual([first!.text])
    expect(first!.evidence).toEqual([explicitEvidence(first!.text, 'experience', 'exp-0')])

    expect(second!.id).toBe('exp-0-bullet-1')
    expect(second!.technologies.map((t) => [t.rawName, t.canonicalName])).toEqual([
      ['JavaScript', 'javascript'],
      ['TypeScript', 'typescript'],
    ])
    expect(second!.responsibilities).toEqual([second!.text])
  })

  it('gives each experience entry an id, normalized title, aggregated technologies, and its meta line as evidence', () => {
    const current = resume.experience[0]!
    expect(current.id).toBe('exp-0')
    expect(current.normalizedJobTitle).toBe('frontend engineer')
    expect(current.technologies).toEqual(['react', 'javascript', 'typescript'])
    expect(current.experienceType).toBe('unspecified')
    expect(current.evidence).toEqual([explicitEvidence('Frontend Engineer, Acme Corp | Remote | Mar 2021 - Present', 'experience', 'exp-0')])
    expect(current.warnings).toEqual([])
    expect(resume.experience[1]!.id).toBe('exp-1')
  })

  it('extracts education with degree and field of study split out', () => {
    expect(resume.education).toHaveLength(1)
    const entry = resume.education[0]!
    expect(entry.institution).toBe('University of Texas')
    expect(entry.degree).toContain('B.S.')
    expect(entry.fieldOfStudy).toBe('Computer Science')
    expect(entry.startDate).toBe('2015-01-01')
    expect(entry.endDate).toBe('2019-01-01')
    expect(entry.id).toBe('edu-0')
    expect(entry.evidence).toEqual([
      explicitEvidence('University of Texas, B.S. in Computer Science, Austin, TX | 2015 - 2019', 'education', 'edu-0'),
    ])
  })

  it('extracts certifications with issuer and issue date', () => {
    expect(resume.certifications).toEqual([
      {
        id: 'cert-0',
        name: 'AWS Certified Solutions Architect',
        issuer: 'Amazon Web Services',
        issueDate: '2022-01-01',
        expirationDate: null,
        evidence: [explicitEvidence('AWS Certified Solutions Architect - Amazon Web Services (2022)', 'certifications', 'cert-0')],
      },
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
    expect(project.id).toBe('proj-0')
    expect(project.evidence).toEqual([
      explicitEvidence('Resume Analyzer - A tool that scores resumes against job descriptions', 'projects', 'proj-0'),
    ])
  })

  it('produces no warnings for a well-formed resume', () => {
    expect(warnings).toEqual([])
    expect(resume.parserWarnings).toEqual([])
  })

  it('records the detected sections in document order, with the literal heading', () => {
    expect(resume.sections).toEqual([
      { id: 'section-0', type: 'contact', heading: null, order: 0, lineCount: 4 },
      { id: 'section-1', type: 'summary', heading: 'Summary', order: 1, lineCount: 1 },
      { id: 'section-2', type: 'skills', heading: 'Technical Skills', order: 2, lineCount: 2 },
      { id: 'section-3', type: 'experience', heading: 'Work Experience', order: 3, lineCount: 5 },
      { id: 'section-4', type: 'education', heading: 'Education', order: 4, lineCount: 1 },
      { id: 'section-5', type: 'certifications', heading: 'Certifications', order: 5, lineCount: 1 },
      { id: 'section-6', type: 'projects', heading: 'Projects', order: 6, lineCount: 4 },
    ])
  })

  it('records deterministic metadata and a content-derived id — no timestamps', () => {
    expect(resume.id).toMatch(/^resume-[0-9a-f]{8}$/)
    expect(resume.metadata).toEqual({ sourceFormat: 'text', characterCount: SAMPLE_RESUME.trim().length, lineCount: 24 })
    expect(resume.parserMetadata).toEqual({ parser: 'talentlens-rule-based', parserVersion: '2.0.0', taxonomyVersion: '1.0.0' })
    expect(parseResumeText(SAMPLE_RESUME, { sourceFormat: 'pdf' }).resume.metadata.sourceFormat).toBe('pdf')
  })

  it('is fully deterministic: the same text always parses to an identical Resume', () => {
    expect(parseResumeText(SAMPLE_RESUME)).toEqual(parseResumeText(SAMPLE_RESUME))
    expect(parseResumeText(SAMPLE_RESUME).resume.id).not.toBe(parseResumeText(`${SAMPLE_RESUME}\nExtra line`).resume.id)
  })

  it('has empty languages/awards when the resume has no such sections', () => {
    expect(resume.languages).toEqual([])
    expect(resume.awards).toEqual([])
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
    expect(resume.experience[0]!.bullets.map((b) => b.id)).toEqual(['exp-0-bullet-0', 'exp-0-bullet-1'])
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

describe('parseResumeText with a multi-part company name', () => {
  it('keeps a comma-containing company name intact instead of truncating it', () => {
    const text = [
      'Priya Nair',
      'priya.nair@example.com',
      '',
      'Work Experience',
      'Software Engineer, Acme, Inc. | Mar 2021 - Present',
      '- Designed microservices.',
    ].join('\n')

    const { resume } = parseResumeText(text)
    expect(resume.experience[0]!.title).toBe('Software Engineer')
    expect(resume.experience[0]!.company).toBe('Acme, Inc.')
  })

  it('keeps a multi-part company name intact when the title comes second', () => {
    const text = [
      'Priya Nair',
      'priya.nair@example.com',
      '',
      'Work Experience',
      'Acme, Global Holdings, Backend Engineer | Mar 2021 - Present',
      '- Designed microservices.',
    ].join('\n')

    const { resume } = parseResumeText(text)
    expect(resume.experience[0]!.title).toBe('Backend Engineer')
    expect(resume.experience[0]!.company).toBe('Acme, Global Holdings')
  })
})

describe('parseResumeText edge cases', () => {
  it('returns an empty resume with a warning when no text was extracted', () => {
    const { resume, warnings } = parseResumeText('   ')
    expect(resume.contact.name).toBeNull()
    expect(resume.skills).toEqual([])
    expect(warnings).toContain('No text could be extracted from this document.')
    expect(resume.parserWarnings).toEqual(warnings)
  })

  it('warns when the document is very short', () => {
    const { warnings } = parseResumeText('Jordan Rivera\nCook')
    expect(warnings).toContain('This document is very short for a resume — parsing may be incomplete.')
  })

  it('merges a bullet wrapped across two extracted lines instead of truncating it and adding a phantom bullet', () => {
    // Real PDF extraction commonly wraps a long bullet's text onto a second
    // line with no bullet marker of its own — this must not be read as a
    // second, unrelated bullet, or the first bullet ends up truncated
    // mid-sentence and the "continuation" shows up as a fragment.
    const text = [
      'Jordan Rivera',
      'jordan@example.com',
      '',
      'Work Experience',
      'Senior Engineer, Acme Corp | Mar 2021 - Present',
      '- Architected scalable web applications using React, TypeScript, and',
      '  reusable component patterns across the team.',
      '- Reduced page load time by 35% through code splitting.',
    ].join('\n')

    const { resume } = parseResumeText(text)
    expect(resume.experience[0]!.bullets.map((b) => b.text)).toEqual([
      'Architected scalable web applications using React, TypeScript, and reusable component patterns across the team.',
      'Reduced page load time by 35% through code splitting.',
    ])
  })

  it('merges a wrapped project bullet the same way experience bullets are merged', () => {
    const text = [
      'Jordan Rivera',
      'jordan@example.com',
      '',
      'Projects',
      'Resume Analyzer - A tool that scores resumes against job descriptions',
      '- Built a scoring engine that evaluates skill coverage and',
      '  responsibility alignment against a parsed job description.',
    ].join('\n')

    const { resume } = parseResumeText(text)
    expect(resume.projects[0]!.bullets).toEqual([
      'Built a scoring engine that evaluates skill coverage and responsibility alignment against a parsed job description.',
    ])
  })

  it('splits title from company on an "@" separator (common on LinkedIn-exported resumes)', () => {
    const text = `Jordan Rivera\njordan@example.com\n\nWork Experience\nSenior Backend Engineer @ Acme Corp\nJan 2020 - Present\n- Shipped things.\n`
    const { resume, warnings } = parseResumeText(text)
    expect(resume.experience[0]!.title).toBe('Senior Backend Engineer')
    expect(resume.experience[0]!.company).toBe('Acme Corp')
    expect(warnings.some((w) => w.includes("couldn't separate"))).toBe(false)
  })

  it('splits title from company on a plain hyphen with spaces, without breaking a hyphenated title', () => {
    const text = `Jordan Rivera\njordan@example.com\n\nWork Experience\nFull-Stack Engineer - Acme Corp\nJan 2020 - Present\n- Shipped things.\n`
    const { resume, warnings } = parseResumeText(text)
    expect(resume.experience[0]!.title).toBe('Full-Stack Engineer')
    expect(resume.experience[0]!.company).toBe('Acme Corp')
    expect(warnings.some((w) => w.includes("couldn't separate"))).toBe(false)
  })

  it('splits title from company on a whitespace-column layout with no punctuation separator', () => {
    const text = `Jordan Rivera\njordan@example.com\n\nWork Experience\nSenior Backend Engineer    Acme Corp\nJan 2020 - Present\n- Shipped things.\n`
    const { resume, warnings } = parseResumeText(text)
    expect(resume.experience[0]!.title).toBe('Senior Backend Engineer')
    expect(resume.experience[0]!.company).toBe('Acme Corp')
    expect(warnings.some((w) => w.includes("couldn't separate"))).toBe(false)
  })

  it('splits title from company on a literal tab', () => {
    const text = `Jordan Rivera\njordan@example.com\n\nWork Experience\nSenior Backend Engineer\tAcme Corp\nJan 2020 - Present\n- Shipped things.\n`
    const { resume } = parseResumeText(text)
    expect(resume.experience[0]!.title).toBe('Senior Backend Engineer')
    expect(resume.experience[0]!.company).toBe('Acme Corp')
  })

  it('splits title from company on "At" with capitalized casing', () => {
    const text = `Jordan Rivera\njordan@example.com\n\nWork Experience\nSenior Backend Engineer At Acme Corp\nJan 2020 - Present\n- Shipped things.\n`
    const { resume } = parseResumeText(text)
    expect(resume.experience[0]!.title).toBe('Senior Backend Engineer')
    expect(resume.experience[0]!.company).toBe('Acme Corp')
  })

  it('warns but does not crash when an experience entry has no separator to split title from company', () => {
    const text = `Jordan Rivera\njordan@example.com\n\nWork Experience\nRan my own bakery for 2019 - 2021\n- Baked bread.\n`
    const { resume, warnings } = parseResumeText(text)
    expect(resume.experience).toHaveLength(1)
    expect(resume.experience[0]!.company).toBe('')
    expect(warnings.some((w) => w.includes("couldn't separate the title from the company"))).toBe(true)
    expect(resume.experience[0]!.warnings).toEqual(["Experience entry 1: couldn't separate the title from the company."])
  })

  it('never fabricates a skill, an employer, or contact info that is not in the source text', () => {
    const { resume } = parseResumeText('Jordan Rivera\n\nWork Experience\n\nEducation\n')
    expect(resume.skills).toEqual([])
    expect(resume.experience).toEqual([])
    expect(resume.contact.email).toBeNull()
    expect(resume.languages).toEqual([])
    expect(resume.awards).toEqual([])
  })

  it('only marks a role current when the text literally says so', () => {
    const text = `Jordan Rivera\njordan@example.com\n\nWork Experience\nEngineer, Acme | 2019\n- Shipped things.\n`
    const { resume } = parseResumeText(text)
    expect(resume.experience[0]!.endDate).toBeNull()
    expect(resume.experience[0]!.isCurrent).toBe(false)
  })

  it('reads an internship from the entry text', () => {
    const text = `Jordan Rivera\njordan@example.com\n\nWork Experience\nSoftware Engineering Intern, Acme | Jun 2019 - Aug 2019\n- Shipped things.\n`
    expect(parseResumeText(text).resume.experience[0]!.experienceType).toBe('internship')
  })
})

describe('parseResumeText languages and awards', () => {
  it('parses a spoken-languages section with proficiency', () => {
    const text = [
      'Jordan Rivera',
      'jordan@example.com',
      '',
      'Languages',
      'English (Native), Spanish - Fluent',
      'French',
    ].join('\n')
    const { resume } = parseResumeText(text)
    expect(resume.languages).toEqual([
      { id: 'lang-0', name: 'English', proficiency: 'Native', evidence: [explicitEvidence('English (Native), Spanish - Fluent', 'other', 'lang-0')] },
      { id: 'lang-1', name: 'Spanish', proficiency: 'Fluent', evidence: [explicitEvidence('English (Native), Spanish - Fluent', 'other', 'lang-1')] },
      { id: 'lang-2', name: 'French', proficiency: null, evidence: [explicitEvidence('French', 'other', 'lang-2')] },
    ])
    expect(resume.skills).toEqual([])
  })

  it('routes a "Languages" section of programming languages to skills instead', () => {
    const text = ['Jordan Rivera', 'jordan@example.com', '', 'Languages', 'JavaScript, Python, Go'].join('\n')
    const { resume } = parseResumeText(text)
    expect(resume.languages).toEqual([])
    expect(resume.skills.map((s) => s.rawName)).toEqual(['JavaScript', 'Python', 'Go'])
  })

  it('parses an awards section into title, issuer, and date', () => {
    const text = [
      'Jordan Rivera',
      'jordan@example.com',
      '',
      'Honors & Awards',
      "- Dean's List, University of Texas (2018)",
      '- Hackathon Winner',
    ].join('\n')
    const { resume } = parseResumeText(text)
    expect(resume.awards).toEqual([
      {
        id: 'award-0',
        title: "Dean's List",
        issuer: 'University of Texas',
        date: '2018-01-01',
        evidence: [explicitEvidence("Dean's List, University of Texas (2018)", 'other', 'award-0')],
      },
      { id: 'award-1', title: 'Hackathon Winner', issuer: null, date: null, evidence: [explicitEvidence('Hackathon Winner', 'other', 'award-1')] },
    ])
    expect(resume.sections.map((s) => s.type)).toEqual(['contact', 'awards'])
  })
})
