import { describe, expect, it } from 'vitest'
import { normalizeTitle } from './normalizeTitle'

describe('normalizeTitle', () => {
  it('strips a seniority prefix and canonicalizes the core title', () => {
    expect(normalizeTitle('Sr. Frontend Developer')).toEqual({ seniority: 'senior', coreTitle: 'frontend engineer' })
    expect(normalizeTitle('Senior Front-End Engineer')).toEqual({ seniority: 'senior', coreTitle: 'frontend engineer' })
  })

  it('treats a title with no recognized seniority prefix as unspecified, not a guess', () => {
    expect(normalizeTitle('Frontend Engineer')).toEqual({ seniority: null, coreTitle: 'frontend engineer' })
  })

  it('recognizes junior, staff, lead, and manager prefixes', () => {
    expect(normalizeTitle('Jr. Software Engineer').seniority).toBe('junior')
    expect(normalizeTitle('Staff Software Engineer').seniority).toBe('staff')
    expect(normalizeTitle('Lead Backend Engineer').seniority).toBe('lead')
    expect(normalizeTitle('Engineering Manager').seniority).toBe('manager')
  })

  it('falls back to a plain lowercase for an unrecognized core title', () => {
    expect(normalizeTitle('Chief Astronaut')).toEqual({ seniority: null, coreTitle: 'chief astronaut' })
  })
})
