import type { Resume } from '@/types/resume'
import { normalizeSkillName } from '@/lib/normalization/skillDictionary'
import { tokenOverlapRatio } from './fuzzyMatch'
import type { SkillMatchEntry } from './types'

/** Below this token-overlap ratio against a resume skill name, two skills are considered unrelated, not "partial". */
const FUZZY_PARTIAL_THRESHOLD = 0.5

function allBullets(resume: Resume): string[] {
  return [...resume.experience.flatMap((entry) => entry.bullets), ...resume.projects.flatMap((project) => project.bullets)]
}

/**
 * Matches one JD skill against a resume in layers, stopping at the first
 * confident layer (see docs/scoring/matching-rules.md):
 *
 * 1. Exact/normalized/synonym — collapsed into one step here, since our
 *    normalization dictionary (TASK-007) *is* a synonym table: "React",
 *    "React.js", and "ReactJS" all normalize to the same canonical form.
 * 2. A precise (substring, not fuzzy) mention of the canonical skill
 *    phrase within an experience/project bullet — e.g. a bullet reading
 *    "REST API development" satisfies a JD asking for "RESTful API",
 *    because both normalize to the same "rest api" phrase.
 * 3. Fuzzy — token overlap against the resume's own skill list only
 *    (never against arbitrary bullet text, which risks false positives)
 *    — "related" but not exact, reported as `partial`.
 *
 * A JD skill with no evidence at any layer is `missing`, never guessed.
 */
export function matchSkill(jdSkillName: string, resume: Resume): SkillMatchEntry {
  const canonical = normalizeSkillName(jdSkillName)
  const isNormalizedVariant = canonical !== jdSkillName.trim().toLowerCase()

  const exactMatch = resume.skills.find((skill) => normalizeSkillName(skill.name) === canonical)
  if (exactMatch) {
    const evidence = exactMatch.evidence.length > 0 ? exactMatch.evidence : [exactMatch.name]
    return {
      requirement: jdSkillName,
      skill: canonical,
      status: 'matched',
      matchType: isNormalizedVariant ? 'normalized' : 'exact',
      confidence: 1,
      evidence,
      reason: `Found "${exactMatch.name}" in the resume's skills list.`,
    }
  }

  const bulletMatch = allBullets(resume).find((bullet) => bullet.toLowerCase().includes(canonical))
  if (bulletMatch) {
    return {
      requirement: jdSkillName,
      skill: canonical,
      status: 'matched',
      matchType: 'synonym',
      confidence: 0.9,
      evidence: [bulletMatch],
      reason: `"${canonical}" is mentioned directly in an experience or project bullet.`,
    }
  }

  let bestFuzzy: { name: string; ratio: number } | null = null
  for (const skill of resume.skills) {
    const ratio = tokenOverlapRatio(jdSkillName, skill.name)
    if (!bestFuzzy || ratio > bestFuzzy.ratio) bestFuzzy = { name: skill.name, ratio }
  }
  if (bestFuzzy && bestFuzzy.ratio >= FUZZY_PARTIAL_THRESHOLD) {
    return {
      requirement: jdSkillName,
      skill: canonical,
      status: 'partial',
      matchType: 'fuzzy',
      confidence: Math.round(bestFuzzy.ratio * 100) / 100,
      evidence: [bestFuzzy.name],
      reason: `The resume lists "${bestFuzzy.name}", which is related but not a confirmed match for "${jdSkillName}".`,
    }
  }

  return {
    requirement: jdSkillName,
    skill: canonical,
    status: 'missing',
    matchType: 'none',
    confidence: 1,
    evidence: [],
    reason: `No evidence of "${jdSkillName}" was found in the resume's skills or bullets.`,
  }
}

export function matchSkills(jdSkillNames: string[], resume: Resume): SkillMatchEntry[] {
  return jdSkillNames.map((name) => matchSkill(name, resume))
}
