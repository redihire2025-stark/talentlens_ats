import { describe, expect, it } from 'vitest'
import { analyzeResumeLayout, splitResumeSections } from './textSections'

describe('splitResumeSections', () => {
  it('splits recognized headers, case-insensitively, with common aliases', () => {
    const text = [
      'Jordan Rivera',
      'jordan@example.com',
      '',
      'SUMMARY',
      'Frontend engineer.',
      '',
      'Technical Skills',
      'React, TypeScript',
      '',
      'Work Experience',
      'Acme Corp',
      '',
      'Education',
      'UT Austin',
    ].join('\n')

    const sections = splitResumeSections(text)
    expect(sections.header).toEqual(['Jordan Rivera', 'jordan@example.com', ''])
    expect(sections.summary).toEqual(['Frontend engineer.', ''])
    expect(sections.skills).toEqual(['React, TypeScript', ''])
    expect(sections.experience).toEqual(['Acme Corp', ''])
    expect(sections.education).toEqual(['UT Austin'])
  })

  it('recognizes "Core Technical Skills" as a skills header', () => {
    const text = ['CORE TECHNICAL SKILLS', 'React, TypeScript', '', 'PROFESSIONAL EXPERIENCE', 'Acme Corp'].join('\n')
    const sections = splitResumeSections(text)
    expect(sections.skills).toEqual(['React, TypeScript', ''])
    expect(sections.experience).toEqual(['Acme Corp'])
  })

  it('keeps unrecognized content in header rather than dropping it', () => {
    const sections = splitResumeSections('Just some text\nwith no recognized headers at all')
    expect(sections.header).toEqual(['Just some text', 'with no recognized headers at all'])
    expect(sections.experience).toEqual([])
  })

  it('does not treat a long sentence as a header even if it starts with a section word', () => {
    const text = 'Experience building scalable systems is something I bring to every team I join here today'
    const sections = splitResumeSections(text)
    expect(sections.header).toEqual([text])
  })

  it.each(['Skills & Technologies', 'Skills and Technologies', 'Tech Stack', 'Technical Proficiencies', 'Areas of Expertise', 'Key Skills'])(
    'recognizes "%s" as a skills section header',
    (heading) => {
      const sections = splitResumeSections(`${heading}\nReact, TypeScript`)
      expect(sections.skills).toEqual(['React, TypeScript'])
    },
  )

  it('recognizes languages and awards headers', () => {
    const sections = splitResumeSections('Languages\nEnglish\nHonors & Awards\nDean\'s List')
    expect(sections.languages).toEqual(['English'])
    expect(sections.awards).toEqual(["Dean's List"])
  })
})

describe('analyzeResumeLayout', () => {
  it('records every recognized header in document order, as written', () => {
    const { detected } = analyzeResumeLayout('Jordan\nWORK EXPERIENCE\nAcme\nEducation:\nUT\nSkills\nReact')
    expect(detected).toEqual([
      { name: 'experience', heading: 'WORK EXPERIENCE' },
      { name: 'education', heading: 'Education:' },
      { name: 'skills', heading: 'Skills' },
    ])
  })
})
