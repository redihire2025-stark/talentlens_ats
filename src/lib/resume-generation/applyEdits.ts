import type { Resume } from '@/types/resume'
import type { Recommendation, RecommendationStatus } from '@/lib/recommendations/types'
import { buildResumeSkill, linkSkillEvidence, rebuildExperienceEntry, reindexSkills } from '@/lib/schema/resumeBuilders'

/**
 * Every edit here returns a new Resume (the original is never mutated) and
 * rebuilds whatever it touched through the same schema builders the parser
 * uses — an edited bullet gets freshly derived metrics/technologies/action
 * verb, and every skill's bullet evidence is re-linked — so the editor's
 * draft is always exactly what parsing that text would have produced.
 */

/** Replaces one experience bullet's text, rebuilding that bullet entity (same id) and re-linking skill evidence. */
export function replaceExperienceBullet(resume: Resume, entryIndex: number, bulletIndex: number, text: string): Resume {
  const entry = resume.experience[entryIndex]
  if (!entry || bulletIndex < 0 || bulletIndex >= entry.bullets.length) return resume

  const bullets = entry.bullets.map((bullet, i) => (i === bulletIndex ? text : bullet.text))
  const experience = resume.experience.map((e, i) => (i === entryIndex ? rebuildExperienceEntry(e, { bullets }, i) : e))

  return linkSkillEvidence({ ...resume, experience })
}

export function updateSummary(resume: Resume, summary: string): Resume {
  return { ...resume, summary: summary.trim() || null }
}

/**
 * Replaces the skills list wholesale from a flat list of names, keeping
 * each skill's existing category and skills-list evidence when the name is
 * unchanged, and building new/renamed entries as category "other" whose
 * evidence is the name as typed into the skills list. Ids are re-assigned
 * positionally and bullet evidence re-linked.
 */
export function updateSkillNames(resume: Resume, names: string[]): Resume {
  const existingByLowerName = new Map(resume.skills.map((skill) => [skill.rawName.toLowerCase(), skill]))

  const skills = names
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name, index) => existingByLowerName.get(name.toLowerCase()) ?? buildResumeSkill({ rawName: name }, index))

  return linkSkillEvidence({ ...resume, skills: reindexSkills(skills) })
}

/** Updates an entry's title or company, rebuilding its derived fields (normalized title, employment type, meta evidence). */
export function updateExperienceField(resume: Resume, entryIndex: number, field: 'title' | 'company', value: string): Resume {
  const experience = resume.experience.map((entry, i) => (i === entryIndex ? rebuildExperienceEntry(entry, { [field]: value }, i) : entry))
  return { ...resume, experience }
}

export interface RecommendationAcceptanceResult {
  resume: Resume
  status: RecommendationStatus
}

/**
 * Resolves a recommendation's location to current array positions. The
 * stable `entryId`/`bulletId` are authoritative; the stored indexes are
 * only a fallback (e.g. a recommendation serialized before ids existed).
 */
function resolveLocation(resume: Resume, location: NonNullable<Recommendation['location']>): { entryIndex: number; bulletIndex: number } {
  const entryIndex = resume.experience.findIndex((entry) => entry.id === location.entryId)
  if (entryIndex === -1) return { entryIndex: location.entryIndex, bulletIndex: location.bulletIndex }
  const bulletIndex = resume.experience[entryIndex]!.bullets.findIndex((bullet) => bullet.id === location.bulletId)
  return { entryIndex, bulletIndex: bulletIndex === -1 ? location.bulletIndex : bulletIndex }
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
  const { entryIndex, bulletIndex } = resolveLocation(resume, recommendation.location)
  const nextResume = replaceExperienceBullet(resume, entryIndex, bulletIndex, text)
  return { resume: nextResume, status }
}
