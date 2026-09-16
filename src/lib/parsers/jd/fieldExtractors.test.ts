import { describe, expect, it } from 'vitest'
import { extractEmploymentType, extractExperienceRequirement, extractLocation, extractTitle } from './fieldExtractors'

describe('extractTitle', () => {
  it('prefers a labeled title line', () => {
    expect(extractTitle(['Acme Corp', 'Job Title: Senior Frontend Engineer'])).toBe('Senior Frontend Engineer')
  })

  it('falls back to the first short header line', () => {
    expect(extractTitle(['Senior Frontend Engineer', 'Acme Corp is hiring.'])).toBe('Senior Frontend Engineer')
  })

  it('returns null when the header only contains sentence-like text', () => {
    expect(extractTitle(['We are looking for a great teammate to join us.'])).toBeNull()
  })
})

describe('extractLocation', () => {
  it('prefers a labeled location line', () => {
    expect(extractLocation('Senior Engineer\nLocation: Austin, TX\n')).toBe('Austin, TX')
  })

  it('recognizes "Remote"', () => {
    expect(extractLocation('This is a fully remote position.')).toBe('Remote')
  })

  it('finds a "City, ST" pattern without a label', () => {
    expect(extractLocation('Join our team in Austin, TX today.')).toBe('Austin, TX')
  })

  it('returns null when no location is found', () => {
    expect(extractLocation('We are hiring a Senior Engineer.')).toBeNull()
  })
})

describe('extractEmploymentType', () => {
  it.each([
    ['This is a full-time position.', 'full-time'],
    ['Part time hours available.', 'part-time'],
    ['6-month contract role.', 'contract'],
    ['Summer internship program.', 'internship'],
    ['Temporary coverage needed.', 'temporary'],
  ] as const)('detects %s -> %s', (text, expected) => {
    expect(extractEmploymentType(text)).toBe(expected)
  })

  it('returns null when no employment type is mentioned', () => {
    expect(extractEmploymentType('We need a great engineer.')).toBeNull()
  })
})

describe('extractExperienceRequirement', () => {
  it('parses a "N+ years" requirement as an open-ended minimum', () => {
    expect(extractExperienceRequirement('5+ years of React experience required.')).toEqual({
      minimumYears: 5,
      maximumYears: null,
    })
  })

  it('parses a "N-M years" range', () => {
    expect(extractExperienceRequirement('2-4 years of experience.')).toEqual({ minimumYears: 2, maximumYears: 4 })
  })

  it('parses a plain "N years" mention as a minimum', () => {
    expect(extractExperienceRequirement('3 years of experience with Node.js.')).toEqual({
      minimumYears: 3,
      maximumYears: null,
    })
  })

  it('returns nulls when no experience requirement is mentioned', () => {
    expect(extractExperienceRequirement('We need a great engineer.')).toEqual({
      minimumYears: null,
      maximumYears: null,
    })
  })
})
