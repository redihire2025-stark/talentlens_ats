import type { Nullable } from '@/types/common'

const MONTHS: Record<string, string> = {
  jan: '01', january: '01',
  feb: '02', february: '02',
  mar: '03', march: '03',
  apr: '04', april: '04',
  may: '05',
  jun: '06', june: '06',
  jul: '07', july: '07',
  aug: '08', august: '08',
  sep: '09', sept: '09', september: '09',
  oct: '10', october: '10',
  nov: '11', november: '11',
  dec: '12', december: '12',
}

const DATE_TOKEN_RE = /\b(?:[A-Za-z]{3,9}\.?\s+\d{4}|\d{1,2}[/-]\d{4}|\d{4}|present|current|now)\b/gi
const MONTH_YEAR_RE = /^([A-Za-z]{3,9})\.?\s+(\d{4})$/
const NUMERIC_DATE_RE = /^(\d{1,2})[/-](\d{4})$/
const YEAR_ONLY_RE = /^(\d{4})$/
const PRESENT_RE = /^(present|current|now)$/i

function parseSingleDateToken(token: string): Nullable<string> {
  const monthYear = token.match(MONTH_YEAR_RE)
  if (monthYear) {
    const month = MONTHS[monthYear[1]!.toLowerCase()]
    if (month) return `${monthYear[2]}-${month}-01`
  }
  const numeric = token.match(NUMERIC_DATE_RE)
  if (numeric) {
    const month = numeric[1]!.padStart(2, '0')
    return `${numeric[2]}-${month}-01`
  }
  const yearOnly = token.match(YEAR_ONLY_RE)
  if (yearOnly) return `${yearOnly[1]}-01-01`
  return null
}

export interface DateRangeMatch {
  startDate: Nullable<string>
  endDate: Nullable<string>
  /** The full matched substring, so callers can strip it from surrounding text. */
  matchedText: string
}

/**
 * Finds a "<date> - <date or present>" style range within a single line
 * (e.g. an experience/education entry's meta line). Deliberately scans for
 * independent date-like tokens rather than one combined regex — resume
 * date formats vary too much for a single reliable pattern, and pairing
 * two loosely-matched tokens is more robust than one strict one.
 */
export function extractDateRange(line: string): DateRangeMatch | null {
  const matches = [...line.matchAll(DATE_TOKEN_RE)]
  if (matches.length === 0) return null

  const first = matches[0]!
  const second = matches[1]
  const firstIsPresent = PRESENT_RE.test(first[0])

  if (!second) {
    return {
      startDate: firstIsPresent ? null : parseSingleDateToken(first[0]),
      endDate: null,
      matchedText: first[0],
    }
  }

  const secondIsPresent = PRESENT_RE.test(second[0])
  const matchedText = line.slice(first.index, second.index! + second[0].length)
  return {
    startDate: firstIsPresent ? null : parseSingleDateToken(first[0]),
    endDate: secondIsPresent ? null : parseSingleDateToken(second[0]),
    matchedText,
  }
}
