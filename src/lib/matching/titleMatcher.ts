import type { MatchInput, TitleMatchResult } from './types'
import { normalizeTitle } from '@/lib/normalization/normalizeTitle'
import { tokenOverlapRatio } from './fuzzyMatch'

const FUZZY_PARTIAL_THRESHOLD = 0.5

/**
 * Compares the JD's title against the candidate's experience titles.
 * Seniority (Senior/Staff/Lead/…) is normalized separately from the core
 * title (TASK-007) but only the core title decides matched/missing here —
 * a seniority mismatch is real signal, but conflating it into a binary
 * match/miss would hide more than it reveals; it's surfaced in the
 * explanation instead.
 */
export function matchTitle({ resume, jobDescription }: MatchInput): TitleMatchResult {
  const jdTitle = jobDescription.title

  if (!jdTitle) {
    return {
      status: 'matched',
      required: false,
      jdTitle: null,
      resumeTitle: null,
      explanation: 'The job description did not state a specific title to compare against.',
      evidence: [],
    }
  }

  if (resume.experience.length === 0) {
    return {
      status: 'missing',
      required: true,
      jdTitle,
      resumeTitle: null,
      explanation: 'No work experience titles were found to compare against the job title.',
      evidence: [],
    }
  }

  const jdNormalized = normalizeTitle(jdTitle)

  for (const entry of resume.experience) {
    const resumeNormalized = normalizeTitle(entry.title)
    if (resumeNormalized.coreTitle === jdNormalized.coreTitle) {
      const seniorityNote =
        jdNormalized.seniority && resumeNormalized.seniority !== jdNormalized.seniority
          ? ` (seniority differs: resume shows "${resumeNormalized.seniority ?? 'unspecified'}", JD asks for "${jdNormalized.seniority}")`
          : ''
      return {
        status: 'matched',
        required: true,
        jdTitle,
        resumeTitle: entry.title,
        explanation: `"${entry.title}" matches the job title "${jdTitle}"${seniorityNote}.`,
        evidence: entry.evidence,
      }
    }
  }

  let bestFuzzy: { title: string; ratio: number; entry: (typeof resume.experience)[number] } | null = null
  for (const entry of resume.experience) {
    const ratio = tokenOverlapRatio(jdTitle, entry.title)
    if (!bestFuzzy || ratio > bestFuzzy.ratio) bestFuzzy = { title: entry.title, ratio, entry }
  }
  if (bestFuzzy && bestFuzzy.ratio >= FUZZY_PARTIAL_THRESHOLD) {
    return {
      status: 'partial',
      required: true,
      jdTitle,
      resumeTitle: bestFuzzy.title,
      explanation: `"${bestFuzzy.title}" is related to, but not the same role as, "${jdTitle}".`,
      evidence: bestFuzzy.entry.evidence.map((e) => ({ ...e, confidence: Math.round(bestFuzzy!.ratio * 100) / 100 })),
    }
  }

  return {
    status: 'missing',
    required: true,
    jdTitle,
    resumeTitle: resume.experience[0]?.title ?? null,
    explanation: `No experience title closely matching "${jdTitle}" was found.`,
    evidence: [],
  }
}
