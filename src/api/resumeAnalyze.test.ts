import { describe, expect, it } from 'vitest'
import { analyzeResume } from './resumeAnalyze'
import { buildTestResume } from '@/lib/ats/testFixtures'

describe('analyzeResume', () => {
  it('returns an ATS score result for a valid resume', async () => {
    const result = await analyzeResume({ resume: buildTestResume() })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.result.score).toBeGreaterThan(0)
  })

  it('rejects a request with no resume', async () => {
    // @ts-expect-error intentionally invalid request
    const result = await analyzeResume({})
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('INVALID_REQUEST')
  })
})
