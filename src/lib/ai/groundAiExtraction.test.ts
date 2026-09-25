import { describe, expect, it } from 'vitest'
import { findSourceLine, groundAiExtraction, isGroundedInSource } from './groundAiExtraction'

const SOURCE = `JANE   DOE
Portland, OR
jane.doe@example.com | (503) 555-0199
https://linkedin.com/in/janedoe

SKILLS
Python, PostgreSQL, Kubernetes, JavaScript

EXPERIENCE
Senior Data Engineer    Northwind Traders    Jan 2020 - Present
- Built streaming ingestion pipelines processing 4TB of events per day
  using Kafka and Spark.
- Reduced warehouse costs by 30%.

EDUCATION
Oregon State University, B.S. Computer Science, 2014 - 2018

CERTIFICATIONS
AWS Certified Data Engineer - Associate
`

describe('isGroundedInSource', () => {
  it('passes verbatim text through', () => {
    expect(isGroundedInSource('Northwind Traders', SOURCE)).toBe(true)
    expect(isGroundedInSource('Reduced warehouse costs by 30%.', SOURCE)).toBe(true)
  })

  it('tolerates case differences', () => {
    expect(isGroundedInSource('Jane Doe', SOURCE)).toBe(true)
    expect(isGroundedInSource('senior data engineer', SOURCE)).toBe(true)
  })

  it('tolerates whitespace differences, including a bullet wrapped across lines', () => {
    expect(isGroundedInSource('Jane Doe', SOURCE)).toBe(true) // source has three spaces
    expect(
      isGroundedInSource('Built streaming ingestion pipelines processing 4TB of events per day using Kafka and Spark.', SOURCE),
    ).toBe(true)
  })

  it('rejects content differences: a changed number, added metric, reworded phrase, or corrected word', () => {
    expect(isGroundedInSource('Reduced warehouse costs by 35%.', SOURCE)).toBe(false)
    expect(isGroundedInSource('Reduced warehouse costs by 30% saving $2M.', SOURCE)).toBe(false)
    expect(isGroundedInSource('Cut warehouse costs by 30%.', SOURCE)).toBe(false)
    expect(isGroundedInSource('Northwind Trading', SOURCE)).toBe(false)
  })

  it('rejects fabricated text that is not in the source at all', () => {
    expect(isGroundedInSource('Terraform', SOURCE)).toBe(false)
    expect(isGroundedInSource('Staff Engineer', SOURCE)).toBe(false)
  })

  it('requires token boundaries so a short skill is not verified by a longer word', () => {
    expect(isGroundedInSource('Java', SOURCE)).toBe(false) // only "JavaScript" is in the source
    expect(isGroundedInSource('Go', 'Worked at Google')).toBe(false)
    expect(isGroundedInSource('Go', 'Skills: Go, Rust')).toBe(true)
    expect(isGroundedInSource('C++', 'Skills: C++, Rust')).toBe(true)
  })

  it('rejects empty or whitespace-only values', () => {
    expect(isGroundedInSource('', SOURCE)).toBe(false)
    expect(isGroundedInSource('   ', SOURCE)).toBe(false)
  })
})

describe('findSourceLine', () => {
  it('returns the trimmed line containing the value', () => {
    expect(findSourceLine(SOURCE, 'postgresql')).toBe('Python, PostgreSQL, Kubernetes, JavaScript')
  })

  it('falls back to the value itself when it only matches across a line break', () => {
    const wrapped = 'Built streaming ingestion pipelines processing 4TB of events per day using Kafka and Spark.'
    expect(findSourceLine(SOURCE, wrapped)).toBe(wrapped)
  })
})

describe('groundAiExtraction', () => {
  it('passes every verified field through unchanged', () => {
    const { data, rejected } = groundAiExtraction(
      {
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        phone: '(503) 555-0199',
        location: 'Portland, OR',
        links: ['https://linkedin.com/in/janedoe'],
        skills: ['Python', 'PostgreSQL', 'Kubernetes'],
        experience: [
          {
            title: 'Senior Data Engineer',
            company: 'Northwind Traders',
            startDate: 'Jan 2020',
            endDate: 'Present',
            bullets: ['Reduced warehouse costs by 30%.'],
          },
        ],
        education: [{ institution: 'Oregon State University', degree: 'B.S.', fieldOfStudy: 'Computer Science', startDate: '2014', endDate: '2018' }],
        certifications: [{ name: 'AWS Certified Data Engineer - Associate' }],
      },
      SOURCE,
    )

    expect(rejected).toEqual([])
    expect(data.name).toBe('Jane Doe')
    expect(data.email).toBe('jane.doe@example.com')
    expect(data.phone).toBe('(503) 555-0199')
    expect(data.links).toEqual(['https://linkedin.com/in/janedoe'])
    expect(data.skills).toEqual(['Python', 'PostgreSQL', 'Kubernetes'])
    expect(data.experience).toEqual([
      {
        title: 'Senior Data Engineer',
        company: 'Northwind Traders',
        location: null,
        startDate: 'Jan 2020',
        endDate: 'Present',
        bullets: ['Reduced warehouse costs by 30%.'],
      },
    ])
    expect(data.education[0]!.institution).toBe('Oregon State University')
    expect(data.certifications[0]!.name).toBe('AWS Certified Data Engineer - Associate')
  })

  it('drops invented skills, contact fields, bullets and dates, and reports their paths (not their values)', () => {
    const { data, rejected } = groundAiExtraction(
      {
        name: 'Jane Q. Doe',
        email: 'jane@doe.dev',
        phone: '(503) 555-0199',
        skills: ['Python', 'Terraform', 'Java', 'Kubernetes'],
        experience: [
          {
            title: 'Senior Data Engineer',
            company: 'Northwind Traders',
            startDate: 'Jan 2019',
            endDate: 'Present',
            bullets: ['Reduced warehouse costs by 30%.', 'Mentored 5 junior engineers.', 'Reduced warehouse costs by 45%.'],
          },
        ],
      },
      SOURCE,
    )

    expect(data.name).toBeNull()
    expect(data.email).toBeNull()
    expect(data.phone).toBe('(503) 555-0199')
    expect(data.skills).toEqual(['Python', 'Kubernetes'])
    expect(data.experience[0]!.startDate).toBeNull()
    expect(data.experience[0]!.endDate).toBe('Present')
    expect(data.experience[0]!.bullets).toEqual(['Reduced warehouse costs by 30%.'])
    expect(rejected).toEqual([
      'experience[0].startDate',
      'experience[0].bullets[1]',
      'experience[0].bullets[2]',
      'name',
      'email',
      'skills[1]',
      'skills[2]',
    ])
    expect(rejected.join(' ')).not.toContain('Terraform')
  })

  it('drops a whole experience entry whose title and company were both invented, even if its bullets are real', () => {
    const { data, rejected } = groundAiExtraction(
      { experience: [{ title: 'VP of Engineering', company: 'Contoso', bullets: ['Reduced warehouse costs by 30%.'] }] },
      SOURCE,
    )
    expect(data.experience).toEqual([])
    expect(rejected).toContain('experience[0]')
  })

  it('drops education/certification/project entries whose anchor field is invented', () => {
    const { data } = groundAiExtraction(
      {
        education: [{ institution: 'Stanford University', degree: 'B.S.' }],
        certifications: [{ name: 'CKA', issuer: 'CNCF' }],
        projects: [{ name: 'Northwind Traders', bullets: ['Reduced warehouse costs by 30%.', 'Invented bullet'] }],
      },
      SOURCE,
    )
    expect(data.education).toEqual([])
    expect(data.certifications).toEqual([])
    // A project whose name verifies keeps only its verified bullets.
    expect(data.projects).toEqual([{ name: 'Northwind Traders', description: null, url: null, bullets: ['Reduced warehouse costs by 30%.'] }])
  })

  it('dedupes list values case/whitespace-insensitively', () => {
    const { data } = groundAiExtraction({ skills: ['Python', 'python', ' PYTHON '] }, SOURCE)
    expect(data.skills).toEqual(['Python'])
  })

  it('treats malformed or non-object responses as empty, never throwing', () => {
    for (const raw of [null, undefined, 'Jane Doe', 42, [], { skills: 'Python', experience: 'lots' }]) {
      const { data } = groundAiExtraction(raw, SOURCE)
      expect(data.name).toBeNull()
      expect(data.skills).toEqual([])
      expect(data.experience).toEqual([])
    }
  })

  it('is deterministic', () => {
    const raw = { name: 'Jane Doe', skills: ['Python', 'Terraform'] }
    expect(groundAiExtraction(raw, SOURCE)).toEqual(groundAiExtraction(raw, SOURCE))
  })
})
