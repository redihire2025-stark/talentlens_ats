import type { Resume } from '@/types/resume'
import { normalizeSkillName } from '@/lib/normalization/skillDictionary'
import type { AnalyzerResult, AtsAnalysisInput } from './types'

export interface SkillEvidenceSplit {
  backedUp: string[]
  /** Skills present in the skills list but never mentioned in an experience/project bullet. */
  listedOnly: string[]
}

/**
 * Splits a resume's skills into those with a supporting bullet mention and
 * those only present in the skills list. Shared by `analyzeSkillsEvidence`
 * below and the recommendation engine (TASK-011), so both agree on exactly
 * which skills lack supporting evidence.
 */
export function splitSkillsByEvidence(resume: Resume): SkillEvidenceSplit {
  const bulletText = [
    ...resume.experience.flatMap((entry) => entry.bullets),
    ...resume.projects.flatMap((project) => project.bullets),
  ]
    .join(' \n ')
    .toLowerCase()

  const backedUp: string[] = []
  const listedOnly: string[] = []

  for (const skill of resume.skills) {
    const normalized = normalizeSkillName(skill.name)
    const mentioned = bulletText.includes(normalized) || bulletText.includes(skill.name.toLowerCase())
    if (mentioned) {
      backedUp.push(skill.name)
    } else {
      listedOnly.push(skill.name)
    }
  }

  return { backedUp, listedOnly }
}

/**
 * A skill listed in the skills section but never mentioned anywhere in the
 * experience bullets is weaker evidence than one backed up by a specific
 * accomplishment. This checks, for each extracted skill, whether its
 * normalized name also appears in at least one experience or project
 * bullet — not whether the skill has an `evidence` entry at all (the
 * parser always populates that from the skills-list line itself, which
 * wouldn't distinguish anything).
 */
export function analyzeSkillsEvidence({ resume }: AtsAnalysisInput): AnalyzerResult {
  if (resume.skills.length === 0) {
    return {
      score: 0,
      strengths: [],
      issues: ['No skills were found to check for supporting evidence.'],
      explanation: 'No skills section was detected.',
    }
  }

  const { backedUp, listedOnly } = splitSkillsByEvidence(resume)
  const score = Math.round((backedUp.length / resume.skills.length) * 100)

  return {
    score,
    strengths: backedUp.length > 0 ? [`${backedUp.length} of ${resume.skills.length} skills are backed up by experience bullets.`] : [],
    issues: listedOnly.length > 0 ? [`${listedOnly.length} skill(s) only appear in the skills list, not in any bullet: ${listedOnly.join(', ')}.`] : [],
    explanation:
      listedOnly.length === 0
        ? 'Every listed skill is also demonstrated in an experience or project bullet.'
        : `${listedOnly.length} of ${resume.skills.length} skills appear only in the skills list, with no supporting bullet.`,
  }
}
