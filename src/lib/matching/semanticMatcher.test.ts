import { describe, expect, it } from 'vitest'
import { NoopSemanticMatcher } from './semanticMatcher'

describe('NoopSemanticMatcher', () => {
  it('always returns an empty result, deterministically', async () => {
    const matcher = new NoopSemanticMatcher()
    expect(await matcher.matchSkills(['react'], ['react', 'docker'])).toEqual([])
  })
})
