import { normalizeSkillName } from '@/lib/normalization/skillDictionary'
import type { AnalyzerResult, AtsAnalysisInput } from './types'

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
  const { skills } = resume

  if (skills.length === 0) {
    return {
      score: 0,
      strengths: [],
      issues: ['No skills were found to check for supporting evidence.'],
      explanation: 'No skills section was detected.',
    }
  }

  const bulletText = [
    ...resume.experience.flatMap((entry) => entry.bullets),
    ...resume.projects.flatMap((project) => project.bullets),
  ]
    .join(' \n ')
    .toLowerCase()

  const backedUp: string[] = []
  const listedOnly: string[] = []

  for (const skill of skills) {
    const normalized = normalizeSkillName(skill.name)
    const mentioned = bulletText.includes(normalized) || bulletText.includes(skill.name.toLowerCase())
    if (mentioned) {
      backedUp.push(skill.name)
    } else {
      listedOnly.push(skill.name)
    }
  }

  const score = Math.round((backedUp.length / skills.length) * 100)

  return {
    score,
    strengths: backedUp.length > 0 ? [`${backedUp.length} of ${skills.length} skills are backed up by experience bullets.`] : [],
    issues: listedOnly.length > 0 ? [`${listedOnly.length} skill(s) only appear in the skills list, not in any bullet: ${listedOnly.join(', ')}.`] : [],
    explanation:
      listedOnly.length === 0
        ? 'Every listed skill is also demonstrated in an experience or project bullet.'
        : `${listedOnly.length} of ${skills.length} skills appear only in the skills list, with no supporting bullet.`,
  }
}
