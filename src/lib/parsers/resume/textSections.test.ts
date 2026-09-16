import { describe, expect, it } from 'vitest'
import { splitResumeSections } from './textSections'

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
})
