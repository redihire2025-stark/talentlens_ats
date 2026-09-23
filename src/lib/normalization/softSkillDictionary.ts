import type { SynonymGroup } from './skillSynonyms'

/**
 * A small, conservative seed list of soft-skill terms, in the same
 * `SynonymGroup` shape as `SKILL_SYNONYM_GROUPS` so the JD prose miner
 * (`extractProseSkills.ts`) can reuse the exact same whole-word matching
 * logic for both. Not exhaustive — extend as real job descriptions surface
 * gaps, same policy as `skillSynonyms.ts`.
 */
export const SOFT_SKILL_GROUPS: SynonymGroup[] = [
  { canonical: 'communication', variants: ['communication', 'communication skills', 'verbal communication', 'written communication'] },
  { canonical: 'leadership', variants: ['leadership', 'leading teams', 'people leadership'] },
  { canonical: 'teamwork', variants: ['teamwork', 'team player', 'team collaboration'] },
  { canonical: 'collaboration', variants: ['collaboration', 'cross-functional collaboration', 'cross functional collaboration'] },
  { canonical: 'problem solving', variants: ['problem solving', 'problem-solving', 'analytical thinking'] },
  { canonical: 'critical thinking', variants: ['critical thinking'] },
  { canonical: 'adaptability', variants: ['adaptability', 'adaptable', 'flexibility'] },
  { canonical: 'time management', variants: ['time management', 'prioritization', 'prioritisation'] },
  { canonical: 'attention to detail', variants: ['attention to detail', 'detail oriented', 'detail-oriented'] },
  { canonical: 'mentoring', variants: ['mentoring', 'mentorship', 'coaching'] },
  { canonical: 'stakeholder management', variants: ['stakeholder management', 'stakeholder communication'] },
  { canonical: 'conflict resolution', variants: ['conflict resolution'] },
  { canonical: 'presentation skills', variants: ['presentation skills', 'public speaking'] },
  { canonical: 'negotiation', variants: ['negotiation', 'negotiation skills'] },
  { canonical: 'ownership', variants: ['ownership', 'self-starter', 'self starter', 'proactive'] },
]
