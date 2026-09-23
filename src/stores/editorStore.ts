import { create } from 'zustand'
import type { Resume } from '@/types/resume'
import type { ScoreResult } from '@/types/score'
import type { AtsScoreBreakdown } from '@/lib/ats/types'
import type { JdMatchScoreBreakdown } from '@/lib/matching/scoringConfig'
import type { Recommendation, RecommendationStatus } from '@/lib/recommendations/types'
import { analyzeAtsCompatibility } from '@/lib/ats/analyzeAtsCompatibility'
import { matchResume } from '@/lib/matching/matchResume'
import { calculateJdMatchScore } from '@/lib/matching/calculateJdMatchScore'
import {
  applyRecommendationAcceptance,
  replaceExperienceBullet,
  updateExperienceField,
  updateSkillNames,
  updateSummary,
} from '@/lib/resume-generation/applyEdits'
import type { JobDescription } from '@/types/jobDescription'
import { generateAiBulletRewrite, sleep } from '@/lib/ai/aiRewrite'

interface EditorState {
  originalResume: Resume | null
  draftResume: Resume | null
  recommendations: Recommendation[]
  statuses: Record<string, RecommendationStatus>
  editedTexts: Record<string, string>
  liveAtsResult: ScoreResult<AtsScoreBreakdown> | null
  liveJdMatchResult: ScoreResult<JdMatchScoreBreakdown> | null

  // AI-drafted bullet rewrites (PRD §14: an optional upgrade over the
  // deterministic suggestedChange, never a dependency). Lives here rather
  // than in the Recommendations screen's local state so it can be started
  // during the resume-analysis processing step (`ProcessingScreen.tsx`)
  // and is already finished — or at least in progress and visible — by the
  // time the user opens "View Recommendations", instead of only starting
  // when that screen mounts.
  aiSuggestions: Record<string, string>
  aiLoadingIds: Record<string, boolean>
  aiQueuedIds: Record<string, boolean>
  aiUpgradesStarted: boolean

  load: (resume: Resume, recommendations: Recommendation[]) => void
  /** Initializes the draft from the resume if nothing has been loaded yet — for opening the editor directly, without visiting Recommendations first. */
  ensureDraft: (resume: Resume) => void
  /** Replaces the draft outright — used when switching to a different saved version. */
  setDraft: (resume: Resume) => void
  setEditedText: (id: string, text: string) => void
  acceptRecommendation: (id: string) => void
  rejectRecommendation: (id: string) => void
  resetRecommendation: (id: string) => void

  /**
   * Kicks off the AI-drafted-rewrite queue for every eligible (bullet-level)
   * recommendation, one at a time, without blocking the caller. Safe to call
   * more than once — a no-op after the first call per `load()` (see
   * `aiUpgradesStarted`) — so both the processing screen and the
   * Recommendations screen can call it and only one queue ever runs.
   */
  startAiUpgrades: (resume: Resume) => void
  /** Requests (or re-requests, for "Regenerate") an AI rewrite for one recommendation. */
  requestAiSuggestion: (rec: Recommendation, resume: Resume) => Promise<void>

  updateSummaryText: (text: string) => void
  updateSkills: (names: string[]) => void
  updateExperienceBullet: (entryIndex: number, bulletIndex: number, text: string) => void
  updateExperienceTitle: (entryIndex: number, title: string) => void
  updateExperienceCompany: (entryIndex: number, company: string) => void

  recalculate: (parserWarnings: string[], jobDescription?: JobDescription) => void
  reset: () => void
}

function recalculateScores(
  draftResume: Resume | null,
  parserWarnings: string[],
  jobDescription: JobDescription | undefined,
): Pick<EditorState, 'liveAtsResult' | 'liveJdMatchResult'> {
  if (!draftResume) return { liveAtsResult: null, liveJdMatchResult: null }

  const atsResult = analyzeAtsCompatibility({ resume: draftResume, parserWarnings })
  if (!jobDescription) return { liveAtsResult: atsResult, liveJdMatchResult: null }

  const input = { resume: draftResume, jobDescription }
  const analysis = matchResume(input)
  const jdMatchResult = calculateJdMatchScore(input, analysis, atsResult.score)
  return { liveAtsResult: atsResult, liveJdMatchResult: jdMatchResult }
}

/**
 * The working draft resume plus recommendation accept/reject state. The
 * draft is never the same object as the original — accepting or editing
 * never mutates `originalResume`, so "revert to original" is always
 * possible (full versioning is TASK-017; this store only tracks the
 * current draft).
 */
export const useEditorStore = create<EditorState>((set, get) => ({
  originalResume: null,
  draftResume: null,
  recommendations: [],
  statuses: {},
  editedTexts: {},
  liveAtsResult: null,
  liveJdMatchResult: null,
  aiSuggestions: {},
  aiLoadingIds: {},
  aiQueuedIds: {},
  aiUpgradesStarted: false,

  load: (resume, recommendations) => {
    set({
      originalResume: resume,
      draftResume: resume,
      recommendations,
      statuses: Object.fromEntries(recommendations.map((r) => [r.id, 'pending' as RecommendationStatus])),
      editedTexts: {},
      aiSuggestions: {},
      aiLoadingIds: {},
      aiQueuedIds: {},
      aiUpgradesStarted: false,
    })
  },

  ensureDraft: (resume) => {
    if (get().draftResume) return
    set({ originalResume: resume, draftResume: resume })
  },

  setDraft: (resume) => set({ draftResume: resume }),

  setEditedText: (id, text) => set((state) => ({ editedTexts: { ...state.editedTexts, [id]: text } })),

  acceptRecommendation: (id) => {
    const { recommendations, editedTexts, draftResume } = get()
    const recommendation = recommendations.find((r) => r.id === id)
    if (!recommendation || !draftResume) return

    const { resume: nextDraft, status } = applyRecommendationAcceptance(draftResume, recommendation, editedTexts[id])

    set((state) => ({ draftResume: nextDraft, statuses: { ...state.statuses, [id]: status } }))
  },

  rejectRecommendation: (id) => set((state) => ({ statuses: { ...state.statuses, [id]: 'rejected' } })),
  resetRecommendation: (id) => set((state) => ({ statuses: { ...state.statuses, [id]: 'pending' } })),

  requestAiSuggestion: async (rec, resume) => {
    if (!rec.location || rec.currentText === null) return
    const entry = resume.experience[rec.location.entryIndex]

    set((state) => {
      const { [rec.id]: _removed, ...restQueued } = state.aiQueuedIds
      return { aiQueuedIds: restQueued, aiLoadingIds: { ...state.aiLoadingIds, [rec.id]: true } }
    })

    const result = await generateAiBulletRewrite({
      bullet: rec.currentText,
      role: entry?.title,
      company: entry?.company,
    })

    set((state) => ({ aiLoadingIds: { ...state.aiLoadingIds, [rec.id]: false } }))
    // Silent on failure/unavailability by design: the deterministic
    // suggestedText already shown on the card is a complete, usable
    // suggestion on its own — an AI outage is never a user-facing error here.
    if (result.ok) {
      set((state) => ({ aiSuggestions: { ...state.aiSuggestions, [rec.id]: result.text } }))
      // Recorded as the "edited" text so accepting applies the AI-upgraded
      // wording rather than falling back to the deterministic suggestedChange.
      get().setEditedText(rec.id, result.text)
    }
  },

  startAiUpgrades: (resume) => {
    if (get().aiUpgradesStarted) return
    set({ aiUpgradesStarted: true })

    const eligible = get().recommendations.filter((r) => r.category === 'bullet-impact' && r.location)
    if (eligible.length === 0) return

    set({ aiQueuedIds: Object.fromEntries(eligible.map((r) => [r.id, true])) })

    // Runs the whole batch one bullet at a time — never in parallel — to
    // stay under the AI provider's rate limit. Not awaited by the caller:
    // this must never block navigation away from the processing screen.
    void (async () => {
      for (const rec of eligible) {
        await get().requestAiSuggestion(rec, resume)
        await sleep(600)
      }
    })()
  },

  updateSummaryText: (text) =>
    set((state) => (state.draftResume ? { draftResume: updateSummary(state.draftResume, text) } : state)),

  updateSkills: (names) =>
    set((state) => (state.draftResume ? { draftResume: updateSkillNames(state.draftResume, names) } : state)),

  updateExperienceBullet: (entryIndex, bulletIndex, text) =>
    set((state) =>
      state.draftResume ? { draftResume: replaceExperienceBullet(state.draftResume, entryIndex, bulletIndex, text) } : state,
    ),

  updateExperienceTitle: (entryIndex, title) =>
    set((state) =>
      state.draftResume ? { draftResume: updateExperienceField(state.draftResume, entryIndex, 'title', title) } : state,
    ),

  updateExperienceCompany: (entryIndex, company) =>
    set((state) =>
      state.draftResume ? { draftResume: updateExperienceField(state.draftResume, entryIndex, 'company', company) } : state,
    ),

  recalculate: (parserWarnings, jobDescription) => {
    set(recalculateScores(get().draftResume, parserWarnings, jobDescription))
  },

  reset: () =>
    set({
      originalResume: null,
      draftResume: null,
      recommendations: [],
      statuses: {},
      editedTexts: {},
      liveAtsResult: null,
      liveJdMatchResult: null,
      aiSuggestions: {},
      aiLoadingIds: {},
      aiQueuedIds: {},
      aiUpgradesStarted: false,
    }),
}))
