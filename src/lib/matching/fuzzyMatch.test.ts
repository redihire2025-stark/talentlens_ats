import { describe, expect, it } from 'vitest'
import { tokenOverlapRatio } from './fuzzyMatch'

describe('tokenOverlapRatio', () => {
  it('returns a high ratio for closely related phrases', () => {
    expect(tokenOverlapRatio('REST API development', 'RESTful API')).toBeGreaterThanOrEqual(0.5)
  })

  it('returns 0 for unrelated phrases', () => {
    expect(tokenOverlapRatio('Docker containerization', 'watercolor painting')).toBe(0)
  })

  it('returns 0 when either input has no meaningful tokens', () => {
    expect(tokenOverlapRatio('', 'React')).toBe(0)
    expect(tokenOverlapRatio('the and for', 'React')).toBe(0)
  })

  it('is symmetric, since it divides by the smaller token set either way', () => {
    const a = tokenOverlapRatio('customer facing web applications', 'Build and maintain customer-facing applications')
    const b = tokenOverlapRatio('Build and maintain customer-facing applications', 'customer facing web applications')
    expect(a).toBe(b)
    expect(a).toBeGreaterThan(0.5)
  })
})
