import { describe, expect, it } from 'vitest'
import type { Nullable } from './common'

describe('Nullable', () => {
  it('allows null in addition to the wrapped type, e.g. an in-progress job endDate', () => {
    const endDate: Nullable<string> = null
    const startDate: Nullable<string> = '2024-01-01'

    expect(endDate).toBeNull()
    expect(startDate).toBe('2024-01-01')
  })
})
