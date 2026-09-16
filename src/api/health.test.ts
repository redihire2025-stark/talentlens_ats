import { describe, expect, it } from 'vitest'
import { getHealth } from './health'

describe('getHealth', () => {
  it('returns ok', async () => {
    expect(await getHealth()).toEqual({ ok: true, data: { status: 'ok' } })
  })
})
