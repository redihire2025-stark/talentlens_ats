import { create } from 'zustand'
import type { Resume } from '@/types/resume'
import type { ScoreResult } from '@/types/score'
import type { AtsScoreCategory } from '@/lib/ats/types'
import { analyzeResume } from '@/api/resumeAnalyze'

export type AnalysisStoreStatus = 'idle' | 'analyzing' | 'ready' | 'error'

interface AnalysisState {
  atsResult: ScoreResult<AtsScoreCategory> | null
  status: AnalysisStoreStatus
  error: string | null
  analyze: (resume: Resume, parserWarnings: string[]) => Promise<void>
  reset: () => void
}

/** The resume's Resume Health / ATS Readiness score — computed once from the parsed Resume, independent of any job description. */
export const useAnalysisStore = create<AnalysisState>((set) => ({
  atsResult: null,
  status: 'idle',
  error: null,

  analyze: async (resume, parserWarnings) => {
    set({ status: 'analyzing', error: null })
    const result = await analyzeResume({ resume, parserWarnings })

    if (result.ok) {
      set({ atsResult: result.data.result, status: 'ready' })
    } else {
      set({ status: 'error', error: result.error.message })
    }
  },

  reset: () => set({ atsResult: null, status: 'idle', error: null }),
}))
