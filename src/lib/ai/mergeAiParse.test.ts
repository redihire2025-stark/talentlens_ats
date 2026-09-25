import { describe, expect, it } from 'vitest'
import { parseResumeText } from '@/lib/parsers/resume/parseResumeText'
import { aiAssistTargets, mergeGroundedAiParse, needsAiAssist } from './mergeAiParse'
import { groundAiExtraction } from './groundAiExtraction'
import { coerceAiParsedResume } from './parseResumePrompt'
import { MESSY_RESUME, NO_SECTIONS_RESUME } from './__fixtures__/resumeTexts'

function grounded(raw: unknown, text: string) {
  return groundAiExtraction(raw, text).data
}

describe('aiAssistTargets / needsAiAssist', () => {
  it('targets nothing for a resume that parsed cleanly', () => {
    const clean = parseResumeText(`Jordan Rivera
Austin, TX
jordan.rivera@example.com | 555-010-1234

Skills
JavaScript, TypeScript, React

Work Experience
Frontend Engineer, Acme Corp | Remote | Mar 2021 - Present
- Built reusable React components used across 4 production applications.

Education
University of Texas, B.S. in Computer Science | 2015 - 2019
`).resume
    expect(clean.parserWarnings).toEqual([])
    expect(needsAiAssist(aiAssistTargets(clean))).toBe(false)
  })

  it('targets exactly the flagged fields', () => {
    const { resume } = parseResumeText(MESSY_RESUME)
    expect(resume.parserWarnings).toEqual([
      "Experience entry 1: couldn't separate the title from the company.",
      'No email or phone number was found — verify contact info manually.',
    ])
    expect(aiAssistTargets(resume)).toEqual({ contact: true, skills: false, experience: false, experienceEntryIds: ['exp-0'] })
  })

  it('does not target anything when no text could be extracted', () => {
    const { resume } = parseResumeText('')
    expect(needsAiAssist(aiAssistTargets(resume))).toBe(false)
  })
})

describe('mergeGroundedAiParse', () => {
  it('splits a title/company the rule-based parser could not, using only text from that entry’s own meta line', () => {
    const { resume } = parseResumeText(MESSY_RESUME)
    const ai = grounded(
      { experience: [{ title: 'Staff Software Engineer', company: 'Globex Corporation', startDate: 'Mar 2019', endDate: 'Present' }] },
      MESSY_RESUME,
    )
    const { resume: merged, filledFields } = mergeGroundedAiParse(resume, ai, MESSY_RESUME, aiAssistTargets(resume))

    const entry = merged.experience[0]!
    expect(entry.title).toBe('Staff Software Engineer')
    expect(entry.company).toBe('Globex Corporation')
    // Everything else about the entry is the rule-based parser's, untouched.
    expect(entry.startDate).toBe(resume.experience[0]!.startDate)
    expect(entry.isCurrent).toBe(true)
    expect(entry.bullets.map((b) => b.text)).toEqual(resume.experience[0]!.bullets.map((b) => b.text))
    expect(entry.evidence).toEqual(resume.experience[0]!.evidence)
    expect(filledFields).toEqual(['experience.exp-0.title', 'experience.exp-0.company'])
    expect(merged.parserMetadata.aiAssist).toEqual({ filledFields, rejectedCount: 0 })
    // Parser warnings stay: they describe how a rule-based ATS reads this document.
    expect(merged.parserWarnings).toEqual(resume.parserWarnings)
  })

  it('will not relabel an entry with a title/company taken from elsewhere in the document', () => {
    const { resume } = parseResumeText(MESSY_RESUME)
    // Both strings are in the resume text (so they ground), but not in this entry's meta line.
    const ai = grounded({ experience: [{ title: 'Staff Software Engineer', company: 'University of Illinois' }] }, MESSY_RESUME)
    const { resume: merged, filledFields } = mergeGroundedAiParse(resume, ai, MESSY_RESUME, aiAssistTargets(resume))
    expect(filledFields).toEqual([])
    expect(merged).toBe(resume)
  })

  it('fills only null contact fields — never overwrites a field the parser extracted', () => {
    const { resume } = parseResumeText(MESSY_RESUME)
    expect(resume.contact.name).toBe('Dana Okafor')
    const ai = grounded({ name: 'Chicago IL', location: 'Chicago IL', email: 'dana@globex.com' }, MESSY_RESUME)
    const { resume: merged, filledFields } = mergeGroundedAiParse(resume, ai, MESSY_RESUME, { ...aiAssistTargets(resume), experienceEntryIds: [] })

    expect(merged.contact.name).toBe('Dana Okafor') // parser's value kept
    expect(merged.contact.location).toBe('Chicago IL')
    expect(merged.contact.email).toBeNull() // invented email never got past grounding
    expect(merged.contact.links).toEqual(resume.contact.links)
    expect(filledFields).toEqual(['contact.location'])
  })

  it('fills a missing skills list and a missing experience section from verified values only', () => {
    const { resume } = parseResumeText(NO_SECTIONS_RESUME)
    const targets = aiAssistTargets(resume)
    expect(targets.skills).toBe(true)
    expect(targets.experience).toBe(true)

    const ai = grounded(
      {
        skills: ['Python', 'Django', 'Redis', 'AWS'],
        experience: [
          {
            title: 'Backend Developer',
            company: 'Initech',
            startDate: 'Jan 2018',
            endDate: 'Dec 2021',
            bullets: ['Built billing APIs serving 3 million customers.', 'Cut latency by 50%.'],
          },
        ],
      },
      NO_SECTIONS_RESUME,
    )
    const { resume: merged, filledFields } = mergeGroundedAiParse(resume, ai, NO_SECTIONS_RESUME, targets)

    expect(merged.skills.map((s) => s.rawName)).toEqual(['Python', 'Django', 'Redis'])
    expect(merged.skills[0]!.evidence[0]!.text).toBe('Backend developer. Toolbox: Python, Django, Redis.')
    expect(merged.experience).toHaveLength(1)
    const entry = merged.experience[0]!
    expect(entry).toMatchObject({ title: 'Backend Developer', company: 'Initech', startDate: '2018-01-01', endDate: '2021-12-01', isCurrent: false })
    expect(entry.bullets.map((b) => b.text)).toEqual(['Built billing APIs serving 3 million customers.'])
    expect(entry.evidence.map((e) => e.text)).toEqual(['Backend Developer at Initech, Jan 2018 - Dec 2021'])
    expect(filledFields).toEqual(['skills', 'experience'])
  })

  it('never touches a field that was not targeted, even when the AI returned (verified) data for it', () => {
    const { resume } = parseResumeText(MESSY_RESUME)
    const ai = grounded({ skills: ['Go'], education: [{ institution: 'University of Illinois' }] }, MESSY_RESUME)
    const { resume: merged } = mergeGroundedAiParse(resume, ai, MESSY_RESUME, aiAssistTargets(resume))
    expect(merged.skills).toEqual(resume.skills)
    expect(merged.education).toEqual(resume.education)
  })

  it('returns the same Resume object when nothing verified', () => {
    const { resume } = parseResumeText(MESSY_RESUME)
    const { resume: merged } = mergeGroundedAiParse(resume, coerceAiParsedResume({}), MESSY_RESUME, aiAssistTargets(resume))
    expect(merged).toBe(resume)
  })
})
