import { describe, expect, it } from 'vitest'
import { suggestActionVerbRewrite } from './bulletQuality'

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
