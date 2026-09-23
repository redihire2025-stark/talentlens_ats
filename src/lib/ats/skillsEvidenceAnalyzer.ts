import type { Resume } from '@/types/resume'
import type { Evidence } from '@/types/evidence'
import { skillMentionedIn } from '@/lib/schema/resumeBuilders'
import { explicitEvidence } from '@/lib/schema/evidence'
import type { AnalyzerResult, AtsAnalysisInput } from './types'

export interface SkillEvidenceSplit {
  /** `rawName` of every listed skill also mentioned in an experience/project bullet. */
  backedUp: string[]
  /** Skills present in the skills list but never mentioned in an experience/project bullet. */
  listedOnly: string[]
  /** For each backed-up skill, the first bullet that mentions it. */
  evidence: Evidence[]
}

/**
 * Splits a resume's skills into those with a supporting bullet mention and
 * those only present in the skills list. Shared by `analyzeSkillsEvidence`
 * below and the recommendation engine (TASK-011), so both agree on exactly
 * which skills lack supporting evidence. Uses the same `skillMentionedIn`
 * rule `linkSkillEvidence` uses to build `ResumeSkill.sources`, recomputed
 * here from the current bullets rather than trusting a possibly-stale
 * `sources` field.
 */
export function splitSkillsByEvidence(resume: Resume): SkillEvidenceSplit {
  const bullets = [
    ...resume.experience.flatMap((entry) => entry.bullets.map((bullet) => ({ text: bullet.text, section: 'experience' as const, entryId: entry.id }))),
    ...resume.projects.flatMap((project) => project.bullets.map((text) => ({ text, section: 'projects' as const, entryId: project.id }))),
  ]

  const backedUp: string[] = []
  const listedOnly: string[] = []
  const evidence: Evidence[] = []

  for (const skill of resume.skills) {
    const supporting = bullets.find((bullet) => skillMentionedIn(skill, bullet.text.toLowerCase()))
    if (supporting) {
      backedUp.push(skill.rawName)
      evidence.push(explicitEvidence(supporting.text, supporting.section, supporting.entryId))
    } else {
      listedOnly.push(skill.rawName)
    }
  }

  return { backedUp, listedOnly, evidence }
}

/**
 * A skill listed in the skills section but never mentioned anywhere in the
 * experience bullets is weaker evidence than one backed up by a specific
 * accomplishment (spec §33). This checks, for each extracted skill,
 * whether its canonical or listed name also appears in at least one
 * experience or project bullet — not whether the skill has skills-list
 * evidence (every listed skill does, which wouldn't distinguish anything).
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

  const { backedUp, listedOnly, evidence } = splitSkillsByEvidence(resume)
  const score = Math.round((backedUp.length / resume.skills.length) * 100)

  return {
    score,
    strengths: backedUp.length > 0 ? [`${backedUp.length} of ${resume.skills.length} skills are backed up by experience bullets.`] : [],
    issues: listedOnly.length > 0 ? [`${listedOnly.length} skill(s) only appear in the skills list, not in any bullet: ${listedOnly.join(', ')}.`] : [],
    explanation:
      listedOnly.length === 0
        ? 'Every listed skill is also demonstrated in an experience or project bullet.'
        : `${listedOnly.length} of ${resume.skills.length} skills appear only in the skills list, with no supporting bullet.`,
    evidence,
  }
}
