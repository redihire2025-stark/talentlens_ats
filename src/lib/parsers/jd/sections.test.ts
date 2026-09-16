import { describe, expect, it } from 'vitest'
import { splitJobDescriptionSections } from './sections'

describe('splitJobDescriptionSections', () => {
  it('splits recognized headers with common aliases', () => {
    const text = [
      'Senior Frontend Engineer',
      '',
      'Responsibilities',
      'Build customer-facing features.',
      '',
      'Requirements',
      'React, TypeScript',
      '',
      'Preferred Qualifications',
      'GraphQL experience',
      '',
      'Education',
      "Bachelor's degree",
    ].join('\n')

    const sections = splitJobDescriptionSections(text)
    expect(sections.header).toEqual(['Senior Frontend Engineer', ''])
    expect(sections.responsibilities).toEqual(['Build customer-facing features.', ''])
    expect(sections.requiredSkills).toEqual(['React, TypeScript', ''])
    expect(sections.preferredSkills).toEqual(['GraphQL experience', ''])
    expect(sections.education).toEqual(["Bachelor's degree"])
  })

  it('keeps unrecognized content in header rather than dropping it', () => {
    const sections = splitJobDescriptionSections('Just some text\nwith no recognized headers')
    expect(sections.header).toEqual(['Just some text', 'with no recognized headers'])
  })
})
