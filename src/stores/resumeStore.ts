import { create } from 'zustand'
import type { Resume } from '@/types/resume'
import { parseResume } from '@/api/resumeParse'

export type ResumeStoreStatus = 'idle' | 'parsing' | 'ready' | 'error'

interface ResumeState {
  file: File | null
  resume: Resume | null
  warnings: string[]
  status: ResumeStoreStatus
  error: string | null
  setFile: (file: File) => void
  parse: () => Promise<void>
  reset: () => void
}

/**
 * The uploaded file and its parsed Resume JSON — the one piece of state
 * every other screen (ATS dashboard, JD match, editor) reads from. See
 * src/stores/README.md for why this is a separate store from analysis/
 * jobDescription/editor/versions rather than one combined store.
 */
export const useResumeStore = create<ResumeState>((set, get) => ({
  file: null,
  resume: null,
  warnings: [],
  status: 'idle',
  error: null,

  setFile: (file) => set({ file, resume: null, warnings: [], status: 'idle', error: null }),

  parse: async () => {
    const { file } = get()
    if (!file) return

    set({ status: 'parsing', error: null })
    const result = await parseResume(file)

    if (result.ok) {
      set({ resume: result.data.resume, warnings: result.data.warnings, status: 'ready' })
    } else {
      set({ status: 'error', error: result.error.message })
    }
  },

  reset: () => set({ file: null, resume: null, warnings: [], status: 'idle', error: null }),
}))
