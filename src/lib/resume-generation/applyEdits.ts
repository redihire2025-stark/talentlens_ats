import type { Resume } from '@/types/resume'
import type { Recommendation, RecommendationStatus } from '@/lib/recommendations/types'

/** Replaces one experience bullet, returning a new Resume (the original is never mutated). */
export function replaceExperienceBullet(resume: Resume, entryIndex: number, bulletIndex: number, text: string): Resume {
  const entry = resume.experience[entryIndex]
  if (!entry || bulletIndex < 0 || bulletIndex >= entry.bullets.length) return resume

  const bullets = entry.bullets.map((bullet, i) => (i === bulletIndex ? text : bullet))
  const experience = resume.experience.map((e, i) => (i === entryIndex ? { ...e, bullets } : e))

  return { ...resume, experience }
}

export function updateSummary(resume: Resume, summary: string): Resume {
  return { ...resume, summary: summary.trim() || null }
}

/** Replaces the skills list wholesale from a flat list of names, keeping each skill's existing category/evidence when the name is unchanged, and defaulting new/renamed entries to category "other". */
export function updateSkillNames(resume: Resume, names: string[]): Resume {
  const existingByLowerName = new Map(resume.skills.map((skill) => [skill.name.toLowerCase(), skill]))

  const skills = names
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => {
      const existing = existingByLowerName.get(name.toLowerCase())
      return existing ?? { name, category: 'other' as const, evidence: [] }
    })

  return { ...resume, skills }
}

export function updateExperienceField(
  resume: Resume,
  entryIndex: number,
  field: 'title' | 'company',
  value: string,
): Resume {
  const experience = resume.experience.map((entry, i) => (i === entryIndex ? { ...entry, [field]: value } : entry))
  return { ...resume, experience }
}

export interface RecommendationAcceptanceResult {
  resume: Resume
  status: RecommendationStatus
}

/**
 * The single rule for "what happens when a recommendation is accepted",
 * shared by `editorStore.acceptRecommendation` (client UI state) and the
 * `src/api/suggestions.ts` accept endpoint (PRD §19's
 * `POST /api/suggestions/:id/accept`) — one place decides this, not two
 * copies that could drift. A recommendation with no `location` (a missing
 * section, a skill gap, a title mismatch) has nothing to apply to the
 * resume text — accepting it only changes its own status. `edited` means
 * the accepted text is neither the resume's original nor the
 * recommendation's own `suggestedText`/`suggestedChange` — the user wrote it.
 */
export function applyRecommendationAcceptance(resume: Resume, recommendation: Recommendation, editedText?: string): RecommendationAcceptanceResult {
  if (!recommendation.location || recommendation.currentText === null) {
    return { resume, status: 'accepted' }
  }

  const text = editedText ?? recommendation.suggestedText ?? recommendation.currentText
  const status: RecommendationStatus = editedText !== undefined && editedText !== recommendation.suggestedText ? 'edited' : 'accepted'
  const nextResume = replaceExperienceBullet(resume, recommendation.location.entryIndex, recommendation.location.bulletIndex, text)
  return { resume: nextResume, status }
}
