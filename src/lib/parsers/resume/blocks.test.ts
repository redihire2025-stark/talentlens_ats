import { describe, expect, it } from 'vitest'
import { mergeWrappedBulletLines } from './blocks'

describe('mergeWrappedBulletLines', () => {
  it('folds a non-bulleted continuation line into the preceding bullet', () => {
    expect(
      mergeWrappedBulletLines([
        '- Architected scalable web applications using React, TypeScript, and',
        '  reusable component patterns across the team.',
        '- Reduced page load time by 35%.',
      ]),
    ).toEqual([
      'Architected scalable web applications using React, TypeScript, and reusable component patterns across the team.',
      'Reduced page load time by 35%.',
    ])
  })

  it('handles a bullet that wraps across more than two lines', () => {
    expect(mergeWrappedBulletLines(['- One', 'two', 'three'])).toEqual(['One two three'])
  })

  it('keeps single-line bullets unchanged', () => {
    expect(mergeWrappedBulletLines(['- First bullet.', '- Second bullet.'])).toEqual(['First bullet.', 'Second bullet.'])
  })

  it('falls back to one item per line when there are no bullet markers at all (paragraph-style entry)', () => {
    expect(mergeWrappedBulletLines(['Built things.', 'Shipped things.'])).toEqual(['Built things.', 'Shipped things.'])
  })

  it('returns an empty array for empty input', () => {
    expect(mergeWrappedBulletLines([])).toEqual([])
  })
})
