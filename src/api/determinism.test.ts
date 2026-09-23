import { describe, expect, it } from 'vitest'
import { parseResumeText } from '@/lib/parsers/resume/parseResumeText'
import { parseJobDescriptionText } from '@/lib/parsers/jd/parseJobDescriptionText'
import { analyzeResume } from './resumeAnalyze'
import { matchResumeToJob } from './match'
import { getRecommendations } from './recommendations'

const RESUME_TEXT = `
Jordan Rivera
Austin, TX
jordan.rivera@example.com | 555-010-1234

Summary
Frontend engineer with 6 years of experience building React applications.

Skills
Languages: JavaScript, TypeScript
Frameworks: React, Next.js
Tools: Docker, Git

Work Experience
Frontend Engineer, Acme Corp | Remote | Mar 2021 - Present
- Built reusable React components used across 4 production applications.
- Responsible for managing the design system.

Software Engineer Intern, Beta Inc | Jun 2018 - Aug 2018
- Reduced API latency by 35% with Redis caching.

Education
University of Texas, B.S. in Computer Science | 2015 - 2019

Languages
English (Native), Spanish (Fluent)

Awards
Hackathon Winner, Acme (2020)
`

const JD_TEXT = `
Senior Frontend Engineer
Location: Austin, TX

Responsibilities
- Build reusable components for production applications.
- Mentor engineers and lead design reviews.

Requirements
5+ years of experience with React
Required Skills: React, TypeScript, Kubernetes

Preferred Qualifications
Preferred Skills: GraphQL, Docker

Education
Bachelor's degree in Computer Science or equivalent experience
`

/** The whole pipeline, from raw text, with no shared objects between runs. */
async function runPipeline() {
  const { resume, warnings } = parseResumeText(RESUME_TEXT)
  const { jobDescription } = parseJobDescriptionText(JD_TEXT)
  const analyzed = await analyzeResume({ resume, parserWarnings: warnings })
  if (!analyzed.ok) throw new Error('analyze failed')
  const matched = await matchResumeToJob({ resume, jobDescription, atsScore: analyzed.data.result.score })
  if (!matched.ok) throw new Error('match failed')
  const recs = await getRecommendations({ resume, parserWarnings: warnings, matchAnalysis: matched.data.analysis })
  if (!recs.ok) throw new Error('recommendations failed')
  return { resume, jobDescription, health: analyzed.data.result, match: matched.data, recommendations: recs.data.recommendations }
}

describe('end-to-end determinism (spec §4)', () => {
  it('produces toEqual output — ids, metadata, evidence, scores, recommendations — for identical input', async () => {
    const first = await runPipeline()
    const second = await runPipeline()
    expect(second).toEqual(first)
  })

  it('has content-derived, not random, ids and no timestamps in the parsed documents', async () => {
    const { resume, jobDescription } = await runPipeline()
    expect(resume.id).toMatch(/^resume-[0-9a-f]{8}$/)
    expect(jobDescription.id).toMatch(/^jd-[0-9a-f]{8}$/)
    const serialized = JSON.stringify({ resume, jobDescription })
    // An ISO timestamp (date + time) anywhere would mean wall-clock data leaked in.
    expect(serialized).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)
  })

  it('keeps Resume Health and Job Match separate, each fully decomposable into its components', async () => {
    const { health, match } = await runPipeline()
    for (const result of [health, match.result]) {
      const sum = result.breakdown.reduce((total, c) => total + c.weightedScore, 0)
      expect(result.score).toBe(Math.round(sum))
    }
    expect(health.breakdown.map((c) => c.category)).not.toEqual(match.result.breakdown.map((c) => c.category))
  })
})
