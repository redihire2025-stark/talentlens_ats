import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { parseResumeText } from '@/lib/parsers/resume/parseResumeText'
import { assistParseWithAi } from './aiAssistedParse'
import { PARSE_RESUME_FUNCTION_ENDPOINT } from './aiParseResume'
import { MESSY_RESUME, NO_SECTIONS_RESUME } from './__fixtures__/resumeTexts'

const CLEAN_RESUME = `Jordan Rivera
Austin, TX
jordan.rivera@example.com | 555-010-1234

Skills
JavaScript, TypeScript, React

Work Experience
Frontend Engineer, Acme Corp | Remote | Mar 2021 - Present
- Built reusable React components used across 4 production applications.

Education
University of Texas, B.S. in Computer Science | 2015 - 2019
`

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('assistParseWithAi', () => {
  it('never sends resume text anywhere for a resume that parsed with no warnings', async () => {
    const { resume } = parseResumeText(CLEAN_RESUME)
    expect(resume.parserWarnings).toEqual([])
    const requestParse = vi.fn()

    const outcome = await assistParseWithAi(resume, CLEAN_RESUME, { requestParse })
    expect(outcome.status).toBe('not-needed')
    expect(outcome.resume).toBe(resume)
    expect(requestParse).not.toHaveBeenCalled()

    // And with the real network caller: fetch is never touched either.
    await assistParseWithAi(resume, CLEAN_RESUME)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('calls the Netlify Function (never OpenAI directly) for a flagged resume', async () => {
    const { resume } = parseResumeText(MESSY_RESUME)
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ ok: true, data: { experience: [{ title: 'Staff Software Engineer', company: 'Globex Corporation' }] } }),
        { status: 200 },
      ),
    )

    const outcome = await assistParseWithAi(resume, MESSY_RESUME)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]![0]).toBe(PARSE_RESUME_FUNCTION_ENDPOINT)
    expect(outcome.status).toBe('applied')
    expect(outcome.resume.experience[0]!.company).toBe('Globex Corporation')
  })

  it('always grounds the response: fabricated values never reach the Resume', async () => {
    const { resume } = parseResumeText(NO_SECTIONS_RESUME)
    const requestParse = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        name: 'Samuel Lee',
        skills: ['Python', 'Kubernetes', 'Terraform'],
        experience: [
          { title: 'Principal Engineer', company: 'Initech', bullets: ['Built billing APIs serving 3 million customers.', 'Saved $4M per year.'] },
          { title: 'CTO', company: 'Hooli', bullets: ['Built billing APIs serving 3 million customers.'] },
        ],
      },
    })

    const outcome = await assistParseWithAi(resume, NO_SECTIONS_RESUME, { requestParse })
    expect(requestParse).toHaveBeenCalledWith({ text: NO_SECTIONS_RESUME.trim() })
    expect(outcome.status).toBe('applied')

    const serialized = JSON.stringify(outcome.resume)
    for (const invented of ['Samuel Lee', 'Kubernetes', 'Terraform', 'Principal Engineer', 'Saved $4M', 'CTO', 'Hooli']) {
      expect(serialized).not.toContain(invented)
    }
    expect(outcome.resume.skills.map((s) => s.rawName)).toEqual(['Python'])
    // "Principal Engineer" was dropped, but the entry survives on its verified company.
    expect(outcome.resume.experience).toHaveLength(1)
    expect(outcome.resume.experience[0]).toMatchObject({ title: '', company: 'Initech' })
    expect(outcome.resume.experience[0]!.bullets.map((b) => b.text)).toEqual(['Built billing APIs serving 3 million customers.'])
    expect(outcome.resume.parserMetadata.aiAssist!.rejectedCount).toBeGreaterThanOrEqual(6)
  })

  it('falls back silently to the deterministic Resume when the server has no key configured', async () => {
    const { resume } = parseResumeText(MESSY_RESUME)
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ ok: false, error: 'No AI provider configured on the server.' }), { status: 200 }))
    const outcome = await assistParseWithAi(resume, MESSY_RESUME)
    expect(outcome).toEqual({ resume, status: 'failed', filledFields: [] })
  })

  it('falls back silently on a network error, a 404 (plain `vite dev`), or a caller that throws', async () => {
    const { resume } = parseResumeText(MESSY_RESUME)

    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    expect((await assistParseWithAi(resume, MESSY_RESUME)).resume).toBe(resume)

    fetchMock.mockResolvedValueOnce(new Response('Not found', { status: 404 }))
    expect((await assistParseWithAi(resume, MESSY_RESUME)).resume).toBe(resume)

    const throwing = vi.fn().mockRejectedValue(new Error('boom'))
    const outcome = await assistParseWithAi(resume, MESSY_RESUME, { requestParse: throwing })
    expect(outcome.status).toBe('failed')
    expect(outcome.resume).toBe(resume)
  })

  it('reports no-change (and keeps the deterministic Resume) when nothing in the response verifies', async () => {
    const { resume } = parseResumeText(MESSY_RESUME)
    const requestParse = vi.fn().mockResolvedValue({ ok: true, data: { email: 'dana@globex.com', experience: [{ title: 'CEO', company: 'Umbrella' }] } })
    const outcome = await assistParseWithAi(resume, MESSY_RESUME, { requestParse })
    expect(outcome.status).toBe('no-change')
    expect(outcome.resume).toBe(resume)
  })

  it('does not send text that is too long', async () => {
    const { resume } = parseResumeText(MESSY_RESUME)
    const requestParse = vi.fn()
    const outcome = await assistParseWithAi(resume, MESSY_RESUME + 'x'.repeat(60_000), { requestParse })
    expect(outcome.status).toBe('skipped')
    expect(requestParse).not.toHaveBeenCalled()
  })
})
