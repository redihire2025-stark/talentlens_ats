import type { AtsAnalysisInput } from '@/lib/ats/types'
import { getMissingSections } from '@/lib/ats/sectionAnalyzer'
import { RECOMMENDATION_IMPACT } from './impactConfig'
import type { Recommendation } from './types'

const GUIDANCE_BY_LABEL: Record<string, string> = {
  Name: 'Add your name at the top of the resume so it can be clearly identified.',
  'Contact info (email or phone)': 'Add an email address or phone number so recruiters can reach you.',
  Summary: 'Add a short professional summary (2-3 sentences) describing your experience and focus, in your own words.',
  'Skills section': 'Add a skills section listing the tools and technologies you have genuine experience with.',
  'Experience section': 'Add your work experience, including company, title, dates, and what you did in each role.',
  'Education section': 'Add your education background, if applicable.',
}

/** Turns each missing required section/field (TASK-008's sectionAnalyzer) into a concrete, low-risk suggestion — never invented content, just structure. */
export function missingSectionRecommendations(input: AtsAnalysisInput): Recommendation[] {
  return getMissingSections(input).map((label) => ({
    id: `missing-section-${label}`,
    category: 'missing-section',
    title: `Add: ${label}`,
    currentText: null,
    guidance: GUIDANCE_BY_LABEL[label] ?? `Add ${label.toLowerCase()} to your resume.`,
    impact: RECOMMENDATION_IMPACT['missing-section'],
  }))
}
