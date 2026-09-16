import { create } from 'zustand'
import type { Resume } from '@/types/resume'
import type { ScoreResult } from '@/types/score'
import type { AtsScoreBreakdown } from '@/lib/ats/types'
import type { JdMatchScoreBreakdown } from '@/lib/matching/scoringConfig'
import type { Recommendation } from '@/lib/recommendations/types'
import { analyzeAtsCompatibility } from '@/lib/ats/analyzeAtsCompatibility'
import { matchResume } from '@/lib/matching/matchResume'
import { calculateJdMatchScore } from '@/lib/matching/calculateJdMatchScore'
import { replaceExperienceBullet, updateExperienceField, updateSkillNames, updateSummary } from '@/lib/resume-generation/applyEdits'
import type { JobDescription } from '@/types/jobDescription'

export type RecommendationStatus = 'pending' | 'accepted' | 'rejected'

interface EditorState {
  originalResume: Resume | null
  draftResume: Resume | null
  recommendations: Recommendation[]
  statuses: Record<string, RecommendationStatus>
  editedTexts: Record<string, string>
  liveAtsResult: ScoreResult<AtsScoreBreakdown> | null
  liveJdMatchResult: ScoreResult<JdMatchScoreBreakdown> | null

  load: (resume: Resume, recommendations: Recommendation[]) => void
  /** Initializes the draft from the resume if nothing has been loaded yet — for opening the editor directly, without visiting Recommendations first. */
  ensureDraft: (resume: Resume) => void
  /** Replaces the draft outright — used when switching to a different saved version. */
  setDraft: (resume: Resume) => void
  setEditedText: (id: string, text: string) => void
  acceptRecommendation: (id: string) => void
  rejectRecommendation: (id: string) => void
  resetRecommendation: (id: string) => void

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

  load: (resume, recommendations) => {
    set({
      originalResume: resume,
      draftResume: resume,
      recommendations,
      statuses: Object.fromEntries(recommendations.map((r) => [r.id, 'pending' as RecommendationStatus])),
      editedTexts: {},
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

    let nextDraft = draftResume
    if (recommendation.location && recommendation.currentText !== null) {
      const text = editedTexts[id] ?? recommendation.currentText
      nextDraft = replaceExperienceBullet(draftResume, recommendation.location.entryIndex, recommendation.location.bulletIndex, text)
    }

    set((state) => ({ draftResume: nextDraft, statuses: { ...state.statuses, [id]: 'accepted' } }))
  },

  rejectRecommendation: (id) => set((state) => ({ statuses: { ...state.statuses, [id]: 'rejected' } })),
  resetRecommendation: (id) => set((state) => ({ statuses: { ...state.statuses, [id]: 'pending' } })),

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
    }),
}))
