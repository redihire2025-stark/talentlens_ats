import type { EducationEntry } from '@/types/resume'
import { splitIntoBlocks } from './blocks'
import { extractDateRange } from './dateUtils'
import { extractLocation } from './fieldExtractors'

const DEGREE_KEYWORD_RE = /\b(bachelor|master|associate|diploma|ph\.?d\.?|b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?a\.?|mba)\b/i
const FIELD_OF_STUDY_RE = /\bin\s+([A-Za-z][A-Za-z\s]+)$/i
const SEPARATOR_RE = /\s*(?:,|\||–|—)\s*/

function parseEducationBlock(block: string[]): EducationEntry {
  let text = block.join(' — ')
  let startDate: string | null = null
  let endDate: string | null = null

  for (const line of block) {
    const range = extractDateRange(line)
    if (range) {
      startDate = range.startDate
      endDate = range.endDate
      text = text.replace(range.matchedText, ' ')
      break
    }
  }

  const location = extractLocation(block)
  if (location) text = text.replace(location, ' ')

  const parts = text.split(SEPARATOR_RE).map((part) => part.trim()).filter(Boolean)

  let institution = ''
  let degree: string | null = null
  for (const part of parts) {
    if (!degree && DEGREE_KEYWORD_RE.test(part)) {
      degree = part
    } else if (!institution) {
      institution = part
    }
  }
  if (!institution && degree) {
    institution = degree
    degree = null
  }

  let fieldOfStudy: string | null = null
  if (degree) {
    const fieldMatch = degree.match(FIELD_OF_STUDY_RE)
    if (fieldMatch) {
      fieldOfStudy = fieldMatch[1]!.trim()
      degree = degree.replace(FIELD_OF_STUDY_RE, '').trim()
    }
  }

  return { institution, degree, fieldOfStudy, startDate, endDate, location }
}

export function buildEducation(educationLines: string[]): EducationEntry[] {
  return splitIntoBlocks(educationLines).map(parseEducationBlock)
}
