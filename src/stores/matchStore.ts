import { create } from 'zustand'
import type { Resume } from '@/types/resume'
import type { JobDescription } from '@/types/jobDescription'
import type { ScoreResult } from '@/types/score'
import type { MatchAnalysis } from '@/lib/matching/types'
import type { JdMatchScoreBreakdown } from '@/lib/matching/scoringConfig'
import { matchResumeToJob } from '@/api/match'

export type MatchStoreStatus = 'idle' | 'matching' | 'ready' | 'error'

interface MatchState {
  analysis: MatchAnalysis | null
  result: ScoreResult<JdMatchScoreBreakdown> | null
  status: MatchStoreStatus
  error: string | null
  match: (resume: Resume, jobDescription: JobDescription, atsScore: number) => Promise<void>
  reset: () => void
}

/** The resume/JD match analysis and Job Match Score — computed once both a resume and a job description are available. */
export const useMatchStore = create<MatchState>((set) => ({
  analysis: null,
  result: null,
  status: 'idle',
  error: null,

  match: async (resume, jobDescription, atsScore) => {
    set({ status: 'matching', error: null })
    const response = await matchResumeToJob({ resume, jobDescription, atsScore })

    if (response.ok) {
      set({ analysis: response.data.analysis, result: response.data.result, status: 'ready' })
    } else {
      set({ status: 'error', error: response.error.message })
    }
  },

  reset: () => set({ analysis: null, result: null, status: 'idle', error: null }),
}))
