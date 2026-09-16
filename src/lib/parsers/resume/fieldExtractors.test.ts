import { describe, expect, it } from 'vitest'
import { extractEmail, extractLinks, extractLocation, extractName, extractPhone } from './fieldExtractors'

describe('extractEmail', () => {
  it('finds an email address in free text', () => {
    expect(extractEmail('Jordan Rivera\njordan.rivera@example.com\n555-010-1234')).toBe('jordan.rivera@example.com')
  })

  it('returns null when there is no email', () => {
    expect(extractEmail('Jordan Rivera')).toBeNull()
  })
})

describe('extractPhone', () => {
  it('finds a phone number', () => {
    expect(extractPhone('Call me at (555) 010-1234 anytime')).toBe('(555) 010-1234')
  })
})

describe('extractLinks', () => {
  it('classifies known link hosts and deduplicates', () => {
    const links = extractLinks(
      'https://linkedin.com/in/jordanrivera https://github.com/jordanrivera https://linkedin.com/in/jordanrivera',
    )
    expect(links).toEqual([
      { type: 'linkedin', url: 'https://linkedin.com/in/jordanrivera' },
      { type: 'github', url: 'https://github.com/jordanrivera' },
    ])
  })

  it('classifies unrecognized hosts as a generic website', () => {
    expect(extractLinks('https://jordanrivera.dev')).toEqual([{ type: 'website', url: 'https://jordanrivera.dev' }])
  })
})

describe('extractName', () => {
  it('picks the first line that is not contact info', () => {
    expect(extractName(['Jordan Rivera', 'jordan@example.com', '555-010-1234'])).toBe('Jordan Rivera')
  })

  it('returns null when every header line looks like contact info', () => {
    expect(extractName(['jordan@example.com', '555-010-1234'])).toBeNull()
  })
})

describe('extractLocation', () => {
  it('finds a "City, ST" pattern', () => {
    expect(extractLocation(['Jordan Rivera', 'Austin, TX'])).toBe('Austin, TX')
  })

  it('recognizes "Remote"', () => {
    expect(extractLocation(['Jordan Rivera', 'Remote'])).toBe('Remote')
  })

  it('returns null when no location is found', () => {
    expect(extractLocation(['Jordan Rivera'])).toBeNull()
  })
})
