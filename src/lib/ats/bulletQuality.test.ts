import { describe, expect, it } from 'vitest'
import { buildDeterministicBulletSuggestion, suggestActionVerbRewrite } from './bulletQuality'

describe('suggestActionVerbRewrite', () => {
  it('rewrites a weak lead-in into the action verb already in the bullet', () => {
    expect(suggestActionVerbRewrite('Responsible for managing a team of 5 engineers.')).toBe(
      'Managed a team of 5 engineers.',
    )
  })

  it('handles other recognized weak lead-ins', () => {
    expect(suggestActionVerbRewrite('Worked on developing the checkout flow.')).toBe('Developed the checkout flow.')
    expect(suggestActionVerbRewrite('Helped with coordinating the release.')).toBe('Coordinated the release.')
  })

  it('never invents words beyond reusing the verb and the rest of the sentence verbatim', () => {
    const result = suggestActionVerbRewrite('Responsible for building internal tooling for the data team.')
    expect(result).toBe('Built internal tooling for the data team.')
  })

  it('returns null when there is no recognized weak lead-in', () => {
    expect(suggestActionVerbRewrite('Built internal tooling for the data team.')).toBeNull()
    expect(suggestActionVerbRewrite('Collaborated with design on the new checkout flow.')).toBeNull()
  })

  it('returns null when the lead-in is followed by an unrecognized verb', () => {
    expect(suggestActionVerbRewrite('Responsible for onboarding new hires.')).toBeNull()
  })
})

describe('buildDeterministicBulletSuggestion', () => {
  it('never returns null or an empty string', () => {
    for (const bullet of [
      'Responsible for managing a team of 5 engineers.',
      'Managing a team of 5 engineers.',
      'I led the migration to TypeScript.',
      'Managed the frontend team.',
      'Collaborated with design on the new checkout flow.',
    ]) {
      const result = buildDeterministicBulletSuggestion(bullet)
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    }
  })

  it('falls back to the weak-lead-in rewrite when one applies', () => {
    expect(buildDeterministicBulletSuggestion('Responsible for managing a team of 5 engineers.')).toBe('Managed a team of 5 engineers.')
  })

  it('rewrites a bare gerund opener with no lead-in phrase', () => {
    expect(buildDeterministicBulletSuggestion('Managing a team of 5 engineers.')).toBe('Managed a team of 5 engineers.')
  })

  it('drops a first-person "I" opener', () => {
    expect(buildDeterministicBulletSuggestion('I led the migration to TypeScript.')).toBe('Led the migration to TypeScript.')
  })

  it('returns the bullet unchanged, verbatim, when no safe rewrite applies', () => {
    expect(buildDeterministicBulletSuggestion('Managed the frontend team.')).toBe('Managed the frontend team.')
  })
})
