import type { SynonymGroup } from './skillSynonyms'
import { toLookupKey } from './lookupKey'

/**
 * Seed data mapping job-title phrasings (seniority already stripped — see
 * titleSeniority.ts) to a canonical core title. Same extensibility
 * philosophy as skillSynonyms.ts: add an entry, not an `if` branch.
 */
export const TITLE_SYNONYM_GROUPS: SynonymGroup[] = [
  {
    canonical: 'software engineer',
    variants: ['software engineer', 'software developer', 'swe', 'sde', 'developer', 'programmer'],
  },
  {
    canonical: 'frontend engineer',
    variants: [
      'frontend engineer', 'front end engineer', 'front-end engineer',
      'frontend developer', 'front end developer', 'front-end developer',
    ],
  },
  {
    canonical: 'backend engineer',
    variants: [
      'backend engineer', 'back end engineer', 'back-end engineer',
      'backend developer', 'back end developer', 'back-end developer',
    ],
  },
  {
    canonical: 'full stack engineer',
    variants: ['full stack engineer', 'fullstack engineer', 'full-stack engineer', 'full stack developer'],
  },
  { canonical: 'data scientist', variants: ['data scientist'] },
  { canonical: 'data engineer', variants: ['data engineer'] },
  { canonical: 'data analyst', variants: ['data analyst'] },
  { canonical: 'product manager', variants: ['product manager', 'pm'] },
  { canonical: 'project manager', variants: ['project manager'] },
  { canonical: 'engineering manager', variants: ['engineering manager', 'em'] },
  { canonical: 'devops engineer', variants: ['devops engineer', 'dev ops engineer', 'site reliability engineer', 'sre'] },
  {
    canonical: 'qa engineer',
    variants: ['qa engineer', 'quality assurance engineer', 'test engineer', 'sdet'],
  },
  { canonical: 'ui/ux designer', variants: ['ui/ux designer', 'ux designer', 'ui designer', 'product designer'] },
  { canonical: 'mobile engineer', variants: ['mobile engineer', 'mobile developer', 'ios engineer', 'android engineer'] },
]

const TITLE_DICTIONARY: ReadonlyMap<string, string> = new Map(
  TITLE_SYNONYM_GROUPS.flatMap((group) => group.variants.map((variant) => [toLookupKey(variant), group.canonical] as const)),
)

/** Looks up a (seniority-stripped) core title. Falls back to a plain lowercase/trim when unrecognized. */
export function normalizeCoreTitle(input: string): string {
  const known = TITLE_DICTIONARY.get(toLookupKey(input))
  return known ?? input.trim().toLowerCase()
}
