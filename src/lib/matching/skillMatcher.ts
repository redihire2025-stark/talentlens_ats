import type { Resume } from '@/types/resume'
import type { JobRequirement } from '@/types/jobDescription'
import type { Evidence } from '@/types/evidence'
import { explicitEvidence } from '@/lib/schema/evidence'
import { tokenOverlapRatio } from './fuzzyMatch'
import type { MatchResult } from './types'

/** Below this token-overlap ratio against a resume skill name, two skills are considered unrelated, not "partial". */
const FUZZY_PARTIAL_THRESHOLD = 0.5
/** Confidence of a canonical term found verbatim inside a bullet rather than the skills list. */
const BULLET_MATCH_CONFIDENCE = 0.9

/** The part of a requirement the skill matcher needs — satisfied by both `JobRequirement` and `Keyword`. */
export type SkillRequirement = Pick<JobRequirement, 'id' | 'rawText' | 'canonicalTerm'>

interface BulletRef {
  text: string
  evidence: Evidence
}

function allBullets(resume: Resume): BulletRef[] {
  return [
    ...resume.experience.flatMap((entry) =>
      entry.bullets.map((bullet) => ({ text: bullet.text, evidence: explicitEvidence(bullet.text, 'experience', entry.id, BULLET_MATCH_CONFIDENCE) })),
    ),
    ...resume.projects.flatMap((project) =>
      project.bullets.map((text) => ({ text, evidence: explicitEvidence(text, 'projects', project.id, BULLET_MATCH_CONFIDENCE) })),
    ),
  ]
}

/**
 * Matches one JD requirement against a resume in layers, stopping at the
 * first confident layer (see docs/scoring/matching-rules.md):
 *
 * 1. Exact/normalized/synonym — collapsed into one step here, since our
 *    normalization dictionary (TASK-007) *is* a synonym table: "React",
 *    "React.js", and "ReactJS" all normalize to the same canonical form,
 *    which the resume skill's `canonicalName` and the requirement's
 *    `canonicalTerm` already carry.
 * 2. A precise (substring, not fuzzy) mention of the canonical skill
 *    phrase within an experience/project bullet — e.g. a bullet reading
 *    "REST API development" satisfies a JD asking for "RESTful API",
 *    because both normalize to the same "rest api" phrase.
 * 3. Fuzzy — token overlap against the resume's own skill list only
 *    (never against arbitrary bullet text, which risks false positives)
 *    — "related" but not exact, reported as `partial`.
 *
 * A JD requirement with no evidence at any layer is `missing`, never guessed.
 */
export function matchSkill(requirement: SkillRequirement, resume: Resume): MatchResult {
  const canonical = requirement.canonicalTerm
  const isNormalizedVariant = canonical !== requirement.rawText.trim().toLowerCase()
  const base = { requirementId: requirement.id, requirement: requirement.rawText, normalizedTerm: canonical }

  const exactMatch = resume.skills.find((skill) => skill.canonicalName === canonical)
  if (exactMatch) {
    return {
      ...base,
      status: 'matched',
      matchType: isNormalizedVariant ? 'normalized' : 'exact',
      confidence: 1,
      evidence: exactMatch.evidence.length > 0 ? exactMatch.evidence : [explicitEvidence(exactMatch.rawName, 'skills', exactMatch.id)],
      reason: `Found "${exactMatch.rawName}" in the resume's skills list.`,
    }
  }

  const bulletMatch = allBullets(resume).find((bullet) => bullet.text.toLowerCase().includes(canonical))
  if (bulletMatch) {
    return {
      ...base,
      status: 'matched',
      matchType: 'synonym',
      confidence: BULLET_MATCH_CONFIDENCE,
      evidence: [bulletMatch.evidence],
      reason: `"${canonical}" is mentioned directly in an experience or project bullet.`,
    }
  }

  let bestFuzzy: { skill: Resume['skills'][number]; ratio: number } | null = null
  for (const skill of resume.skills) {
    const ratio = tokenOverlapRatio(requirement.rawText, skill.rawName)
    if (!bestFuzzy || ratio > bestFuzzy.ratio) bestFuzzy = { skill, ratio }
  }
  if (bestFuzzy && bestFuzzy.ratio >= FUZZY_PARTIAL_THRESHOLD) {
    const confidence = Math.round(bestFuzzy.ratio * 100) / 100
    return {
      ...base,
      status: 'partial',
      matchType: 'fuzzy',
      confidence,
      // The related skill's own name, quoted from the skills list — not the whole list line — since that's what "related" refers to.
      evidence: [explicitEvidence(bestFuzzy.skill.rawName, 'skills', bestFuzzy.skill.id, confidence)],
      reason: `The resume lists "${bestFuzzy.skill.rawName}", which is related but not a confirmed match for "${requirement.rawText}".`,
    }
  }

  return {
    ...base,
    status: 'missing',
    matchType: 'none',
    confidence: 1,
    evidence: [],
    reason: `No evidence of "${requirement.rawText}" was found in the resume's skills or bullets.`,
  }
}

export function matchSkills(requirements: SkillRequirement[], resume: Resume): MatchResult[] {
  return requirements.map((requirement) => matchSkill(requirement, resume))
}
