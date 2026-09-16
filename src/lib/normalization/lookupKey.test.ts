import { describe, expect, it } from 'vitest'
import { toLookupKey } from './lookupKey'

describe('toLookupKey', () => {
  it('collapses spacing and punctuation variants to the same key', () => {
    expect(toLookupKey('React.js')).toBe('reactjs')
    expect(toLookupKey('React JS')).toBe('reactjs')
    expect(toLookupKey('ReactJS')).toBe('reactjs')
  })

  it('is case-insensitive', () => {
    expect(toLookupKey('AWS')).toBe(toLookupKey('aws'))
  })
})
