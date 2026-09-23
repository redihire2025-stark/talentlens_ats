import { describe, expect, it } from 'vitest'
import { buildSkillList, buildSkillListItems } from './buildSkillList'

describe('buildSkillList', () => {
  it('splits a labeled comma list into individual skills', () => {
    expect(buildSkillList(['Required Skills: React, TypeScript, Node.js'])).toEqual(['React', 'TypeScript', 'Node.js'])
  })

  it('splits an unlabeled comma list', () => {
    expect(buildSkillList(['React, TypeScript, GraphQL'])).toEqual(['React', 'TypeScript', 'GraphQL'])
  })

  it('deduplicates case-insensitively', () => {
    expect(buildSkillList(['React, react, TypeScript'])).toEqual(['React', 'TypeScript'])
  })

  it('does not treat a full prose sentence as a skill list', () => {
    expect(buildSkillList(['3+ years of experience building production React applications.'])).toEqual([])
  })

  it('ignores blank lines', () => {
    expect(buildSkillList(['React, TypeScript', '', '  '])).toEqual(['React', 'TypeScript'])
  })

  it('keeps each item\'s source line (bullet marker stripped)', () => {
    expect(buildSkillListItems(['- Required Skills: React, Go'])).toEqual([
      { name: 'React', line: 'Required Skills: React, Go' },
      { name: 'Go', line: 'Required Skills: React, Go' },
    ])
  })
})
