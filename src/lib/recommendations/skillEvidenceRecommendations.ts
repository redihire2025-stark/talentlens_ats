import type { Resume } from '@/types/resume'
import { splitSkillsByEvidence } from '@/lib/ats/skillsEvidenceAnalyzer'
import { RECOMMENDATION_IMPACT } from './impactConfig'
import type { Recommendation } from './types'

/** For each skill listed but never demonstrated in a bullet (TASK-008's skillsEvidenceAnalyzer), suggests adding a real example — never inventing one. */
export function skillEvidenceRecommendations(resume: Resume): Recommendation[] {
  const { listedOnly } = splitSkillsByEvidence(resume)

  return listedOnly.map((skillName) => ({
    id: `skill-evidence-${skillName}`,
    category: 'skill-evidence',
    title: `Back up "${skillName}" with an example`,
    currentText: null,
    suggestedText: null,
    guidance: `"${skillName}" is listed as a skill but isn't mentioned in any experience or project bullet. If you've used it on a specific project, add a bullet describing what you did with it.`,
    impact: RECOMMENDATION_IMPACT['skill-evidence'],
  }))
}
