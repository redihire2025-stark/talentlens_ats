import { JD_MATCH_SCORE_CATEGORIES, type JdMatchScoreCategory } from '@/lib/matching/scoringConfig'

/** Display labels for the JD Match Score's 8 categories — see docs/scoring/scoring-methodology.md. */
export const JD_MATCH_CATEGORY_LABELS: Record<JdMatchScoreCategory, string> = {
  requiredSkills: 'Required Skills',
  preferredSkills: 'Preferred Skills',
  experience: 'Experience',
  responsibilities: 'Responsibilities',
  title: 'Job Title',
  education: 'Education',
  keywords: 'Keywords',
  atsCompatibility: 'ATS Compatibility',
}

export { JD_MATCH_SCORE_CATEGORIES }
