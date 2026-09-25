import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useResumeStore } from './resumeStore'
import { parseResumeText } from '@/lib/parsers/resume/parseResumeText'
import { MESSY_RESUME } from '@/lib/ai/__fixtures__/resumeTexts'

function makeFile(name: string, type: string, sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], name, { type })
}

describe('useResumeStore', () => {
  beforeEach(() => {
    useResumeStore.getState().reset()
  })

  it('starts idle with no file or resume', () => {
    const state = useResumeStore.getState()
    expect(state.file).toBeNull()
    expect(state.resume).toBeNull()
    expect(state.status).toBe('idle')
  })

  it('setFile stores the file and clears any previous result', () => {
    useResumeStore.getState().setFile(makeFile('resume.pdf', 'application/pdf', 1024))
    const state = useResumeStore.getState()
    expect(state.file?.name).toBe('resume.pdf')
    expect(state.resume).toBeNull()
  })

  it('parse() moves to an error state for an unsupported file, without throwing', async () => {
    useResumeStore.getState().setFile(makeFile('resume.txt', 'text/plain', 1024))
    await useResumeStore.getState().parse()
    const state = useResumeStore.getState()
    expect(state.status).toBe('error')
    expect(state.error).toBeTruthy()
  })

  it('parse() is a no-op when no file has been set', async () => {
    await useResumeStore.getState().parse()
    expect(useResumeStore.getState().status).toBe('idle')
  })

  it('reset() clears everything back to idle', () => {
    useResumeStore.getState().setFile(makeFile('resume.pdf', 'application/pdf', 1024))
    useResumeStore.getState().reset()
    const state = useResumeStore.getState()
    expect(state.file).toBeNull()
    expect(state.status).toBe('idle')
  })
})

describe('useResumeStore.assistParse (AI-assisted parsing fallback)', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    useResumeStore.getState().reset()
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function loadParsed(text: string) {
    const { resume, warnings } = parseResumeText(text)
    useResumeStore.setState({ resume, warnings, rawText: text, status: 'ready' })
    return resume
  }

  it('makes no network call for a resume with no parser warnings', async () => {
    const resume = loadParsed(`Jordan Rivera
Austin, TX
jordan.rivera@example.com | 555-010-1234

Skills
JavaScript, TypeScript, React

Work Experience
Frontend Engineer, Acme Corp | Remote | Mar 2021 - Present
- Built reusable React components used across 4 production applications.
`)
    expect(resume.parserWarnings).toEqual([])
    await useResumeStore.getState().assistParse()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(useResumeStore.getState().aiAssistStatus).toBe('not-needed')
    expect(useResumeStore.getState().resume).toBe(resume)
  })

  it('applies verified AI output for a flagged resume, keeping the parser warnings', async () => {
    const resume = loadParsed(MESSY_RESUME)
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, data: { experience: [{ title: 'Staff Software Engineer', company: 'Globex Corporation' }] } })),
    )
    const pending = useResumeStore.getState().assistParse()
    expect(useResumeStore.getState().aiAssistStatus).toBe('running')
    await pending

    const state = useResumeStore.getState()
    expect(state.aiAssistStatus).toBe('applied')
    expect(state.resume?.experience[0]?.company).toBe('Globex Corporation')
    expect(state.warnings).toEqual(resume.parserWarnings)
  })

  it('keeps the deterministic Resume, with no error state, when the AI call fails', async () => {
    const resume = loadParsed(MESSY_RESUME)
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await useResumeStore.getState().assistParse()
    const state = useResumeStore.getState()
    expect(state.status).toBe('ready')
    expect(state.error).toBeNull()
    expect(state.aiAssistStatus).toBe('failed')
    expect(state.resume).toBe(resume)
  })

  it('shares one in-flight request between concurrent calls for the same parse (StrictMode double-run)', async () => {
    loadParsed(MESSY_RESUME)
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: false, error: 'No AI provider configured on the server.' })))
    const first = useResumeStore.getState().assistParse()
    loadParsed(MESSY_RESUME) // same text -> same content-derived id
    await Promise.all([first, useResumeStore.getState().assistParse()])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
