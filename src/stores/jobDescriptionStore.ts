import { create } from 'zustand'
import type { JobDescription } from '@/types/jobDescription'
import { parseJobDescriptionFromText, parseJobDescriptionFromFile } from '@/api/jdParse'

export type JobDescriptionStoreStatus = 'idle' | 'parsing' | 'ready' | 'error'

interface JobDescriptionState {
  text: string
  jobDescription: JobDescription | null
  warnings: string[]
  status: JobDescriptionStoreStatus
  error: string | null
  setText: (text: string) => void
  parseText: () => Promise<void>
  parseFile: (file: File) => Promise<void>
  reset: () => void
}

/** The job description text/file the user provided and its parsed JobDescription JSON. */
export const useJobDescriptionStore = create<JobDescriptionState>((set, get) => ({
  text: '',
  jobDescription: null,
  warnings: [],
  status: 'idle',
  error: null,

  setText: (text) => set({ text, jobDescription: null, status: 'idle', error: null }),

  parseText: async () => {
    const { text } = get()
    if (!text.trim()) return

    set({ status: 'parsing', error: null })
    const result = await parseJobDescriptionFromText({ text })

    if (result.ok) {
      set({ jobDescription: result.data.jobDescription, warnings: result.data.warnings, status: 'ready' })
    } else {
      set({ status: 'error', error: result.error.message })
    }
  },

  parseFile: async (file) => {
    set({ status: 'parsing', error: null })
    const result = await parseJobDescriptionFromFile(file)

    if (result.ok) {
      set({ jobDescription: result.data.jobDescription, warnings: result.data.warnings, status: 'ready' })
    } else {
      set({ status: 'error', error: result.error.message })
    }
  },

  reset: () => set({ text: '', jobDescription: null, warnings: [], status: 'idle', error: null }),
}))
