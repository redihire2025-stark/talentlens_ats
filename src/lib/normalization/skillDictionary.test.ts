import { describe, expect, it } from 'vitest'
import { normalizeSkillName } from './skillDictionary'

describe('normalizeSkillName', () => {
  it.each(['React', 'React.js', 'React JS', 'ReactJS', 'react'])('normalizes %s to "react"', (input) => {
    expect(normalizeSkillName(input)).toBe('react')
  })

  it.each(['Node', 'Node.js', 'Node JS', 'NodeJS'])('normalizes %s to "node.js"', (input) => {
    expect(normalizeSkillName(input)).toBe('node.js')
  })

  it.each(['Postgres', 'PostgreSQL'])('normalizes %s to "postgresql"', (input) => {
    expect(normalizeSkillName(input)).toBe('postgresql')
  })

  it.each(['AWS', 'Amazon Web Services'])('normalizes %s to "aws"', (input) => {
    expect(normalizeSkillName(input)).toBe('aws')
  })

  it('falls back to a plain lowercase/trim for an unrecognized skill, never dropping it', () => {
    expect(normalizeSkillName('  Figma  ')).toBe('figma')
  })
})
