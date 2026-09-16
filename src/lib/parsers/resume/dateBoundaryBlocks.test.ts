import { describe, expect, it } from 'vitest'
import { splitByDateBoundary } from './dateBoundaryBlocks'

describe('splitByDateBoundary', () => {
  it('groups bullets under the entry whose meta line precedes them', () => {
    const blocks = splitByDateBoundary([
      'Frontend Engineer, Acme Corp | Mar 2021 - Present',
      '- Built things.',
      '- Shipped things.',
      'Software Engineer, Beta Inc | Jun 2018 - Feb 2021',
      '- Did other things.',
    ])
    expect(blocks).toEqual([
      ['Frontend Engineer, Acme Corp | Mar 2021 - Present', '- Built things.', '- Shipped things.'],
      ['Software Engineer, Beta Inc | Jun 2018 - Feb 2021', '- Did other things.'],
    ])
  })

  it('does not split on blank lines the way blank-line block splitting does — every non-empty line survives, grouped by date', () => {
    // Simulates mammoth's DOCX extraction, which inserts a blank line after every paragraph, bullets included.
    const mammothStyleLines = [
      'Frontend Engineer, Acme Corp | Mar 2021 - Present',
      '',
      '- Built things.',
      '',
      '- Shipped things.',
      '',
    ]
    expect(splitByDateBoundary(mammothStyleLines)).toEqual([
      ['Frontend Engineer, Acme Corp | Mar 2021 - Present', '- Built things.', '- Shipped things.'],
    ])
  })

  it('returns a single block when no line has a date', () => {
    expect(splitByDateBoundary(['Freelance Consultant', '- Did consulting work.'])).toEqual([
      ['Freelance Consultant', '- Did consulting work.'],
    ])
  })

  it('returns an empty array for no input', () => {
    expect(splitByDateBoundary([])).toEqual([])
  })
})
