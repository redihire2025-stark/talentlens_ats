import { describe, expect, it } from 'vitest'
import { extractDateRange } from './dateUtils'

describe('extractDateRange', () => {
  it('parses a month-year range', () => {
    expect(extractDateRange('Mar 2021 - Jun 2023')).toEqual({
      startDate: '2021-03-01',
      endDate: '2023-06-01',
      matchedText: 'Mar 2021 - Jun 2023',
    })
  })

  it('treats "present" as an ongoing role (null endDate)', () => {
    const result = extractDateRange('January 2022 – Present')
    expect(result?.startDate).toBe('2022-01-01')
    expect(result?.endDate).toBeNull()
  })

  it('parses year-only ranges', () => {
    const result = extractDateRange('2015 - 2019')
    expect(result).toEqual({ startDate: '2015-01-01', endDate: '2019-01-01', matchedText: '2015 - 2019' })
  })

  it('parses numeric month/year dates', () => {
    const result = extractDateRange('03/2021 - 06/2023')
    expect(result).toEqual({ startDate: '2021-03-01', endDate: '2023-06-01', matchedText: '03/2021 - 06/2023' })
  })

  it('returns a single start date when only one date token is present', () => {
    const result = extractDateRange('Acme Corp, 2021')
    expect(result).toEqual({ startDate: '2021-01-01', endDate: null, matchedText: '2021' })
  })

  it('returns null when no date-like token is found', () => {
    expect(extractDateRange('Senior Frontend Engineer')).toBeNull()
  })
})
