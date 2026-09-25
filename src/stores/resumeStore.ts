import { create } from 'zustand'
import type { Resume } from '@/types/resume'
import { assistResumeParse, parseResume } from '@/api/resumeParse'
import type { AssistResumeParseResponse } from '@/api/types'

export type ResumeStoreStatus = 'idle' | 'parsing' | 'ready' | 'error'

/** `idle` before it's been tried; `running` while the AI-assisted parsing fallback is in flight; otherwise its outcome. */
export type AiParseAssistStatus = 'idle' | 'running' | AssistResumeParseResponse['status']

interface ResumeState {
  file: File | null
  resume: Resume | null
  warnings: string[]
  /** The extracted text `resume` was parsed from. In memory only, never persisted; only ever sent anywhere by `assistParse`, and only for a flagged resume. */
  rawText: string | null
  status: ResumeStoreStatus
  error: string | null
  aiAssistStatus: AiParseAssistStatus
  setFile: (file: File) => void
  /** Deterministic parse (always runs). */
  parse: () => Promise<void>
  /**
   * The AI-assisted parsing fallback, run after `parse`. No-op (no network
   * call) unless the deterministic parse raised a structural warning; any
   * failure keeps the deterministic Resume. Never sets `status` to `error`.
   */
  assistParse: () => Promise<void>
  reset: () => void
}

// React StrictMode runs ProcessingScreen's effect twice in development, and
// each run calls parse() + assistParse(). Both runs parse the same text into
// a Resume with the same content-derived id, so the second assistParse()
// awaits the first one's in-flight request instead of paying for a second
// AI call.
let assistInFlight: { resumeId: string; promise: ReturnType<typeof assistResumeParse> } | null = null

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
  rawText: null,
  status: 'idle',
  error: null,
  aiAssistStatus: 'idle',

  setFile: (file) => {
    assistInFlight = null
    set({ file, resume: null, warnings: [], rawText: null, status: 'idle', error: null, aiAssistStatus: 'idle' })
  },

  parse: async () => {
    const { file } = get()
    if (!file) return

    set({ status: 'parsing', error: null, aiAssistStatus: 'idle' })
    const result = await parseResume(file)

    if (result.ok) {
      set({ resume: result.data.resume, warnings: result.data.warnings, rawText: result.data.rawText, status: 'ready' })
    } else {
      set({ status: 'error', error: result.error.message })
    }
  },

  assistParse: async () => {
    const { resume, rawText, status } = get()
    if (status !== 'ready' || !resume || rawText === null) return

    set({ aiAssistStatus: 'running' })
    if (!assistInFlight || assistInFlight.resumeId !== resume.id) {
      assistInFlight = { resumeId: resume.id, promise: assistResumeParse({ resume, rawText }) }
    }
    const result = await assistInFlight.promise

    // Only apply if the store still holds this same parse (not a newer upload).
    if (get().resume?.id !== resume.id) return
    if (result.ok) {
      set({ resume: result.data.resume, aiAssistStatus: result.data.status })
    } else {
      set({ aiAssistStatus: 'failed' })
    }
  },

  reset: () => {
    assistInFlight = null
    set({ file: null, resume: null, warnings: [], rawText: null, status: 'idle', error: null, aiAssistStatus: 'idle' })
  },
}))
