import { describe, expect, it } from 'vitest'
import { findTaxonomyMentions, AMBIGUOUS_PROSE_VARIANTS } from './termMining'
import { SKILL_SYNONYM_GROUPS } from './skillSynonyms'
import { SOFT_SKILL_GROUPS } from './softSkillDictionary'

describe('findTaxonomyMentions', () => {
  it('returns the literal spelling used and prefers the longest variant', () => {
    expect(findTaxonomyMentions('Shipped a React.js app on AWS', SKILL_SYNONYM_GROUPS)).toEqual([
      { canonical: 'react', matchedText: 'React.js' },
      { canonical: 'aws', matchedText: 'AWS' },
    ])
  })

  it('matches variants that end in a symbol (C++), and skips 2-character ones (C#)', () => {
    expect(findTaxonomyMentions('Wrote C++ and C# services', SKILL_SYNONYM_GROUPS).map((m) => m.canonical)).toEqual(['c++'])
  })

  it('skips ambiguous English variants when asked to', () => {
    const text = 'Handled the rest of the release for next quarter'
    expect(findTaxonomyMentions(text, SKILL_SYNONYM_GROUPS, { skipVariants: AMBIGUOUS_PROSE_VARIANTS })).toEqual([])
  })
})

describe('findTaxonomyMentions options', () => {
  it('skips canonical terms already found elsewhere', () => {
    expect(findTaxonomyMentions('React and Docker', SKILL_SYNONYM_GROUPS, { exclude: new Set(['react']) })).toEqual([
      { canonical: 'docker', matchedText: 'Docker' },
    ])
  })

  it('works the same way over the soft-skill dictionary', () => {
    expect(findTaxonomyMentions('Strong Communication skills and mentorship', SOFT_SKILL_GROUPS).map((m) => m.matchedText)).toEqual([
      'Communication skills',
      'mentorship',
    ])
  })

  it('never matches a variant inside a longer word', () => {
    expect(findTaxonomyMentions('TypeScript only', SKILL_SYNONYM_GROUPS).map((m) => m.canonical)).toEqual(['typescript'])
    expect(findTaxonomyMentions('Reactive systems', SKILL_SYNONYM_GROUPS)).toEqual([])
  })
})
