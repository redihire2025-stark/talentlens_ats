import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { parseResumeText } from '@/lib/parsers/resume/parseResumeText'
import { MESSY_RESUME } from '@/lib/ai/__fixtures__/resumeTexts'
import { useResumeStore } from '@/stores/resumeStore'
import { useAnalysisStore } from '@/stores/analysisStore'
import { useEditorStore } from '@/stores/editorStore'
import { useVersionsStore } from '@/stores/versionsStore'
import type { AssistResumeParseResponse } from '@/api/types'

// The network boundary for this screen is the API layer: the deterministic
// parse is replaced by a fixed parse of MESSY_RESUME (flagged: title/company
// not separated, no email/phone), and the AI-assisted fallback by a promise
// the test resolves by hand.
let resolveAssist: (value: { ok: true; data: AssistResumeParseResponse }) => void = () => {}
const assistResumeParse = vi.fn(
  () => new Promise<{ ok: true; data: AssistResumeParseResponse }>((resolve) => (resolveAssist = resolve)),
)

vi.mock('@/api/resumeParse', () => ({
  parseResume: vi.fn(async () => {
    const { resume, warnings } = parseResumeText(MESSY_RESUME)
    return { ok: true, data: { resume, warnings, rawText: MESSY_RESUME } }
  }),
  assistResumeParse: (...args: unknown[]) => assistResumeParse(...(args as [])),
}))

import ProcessingScreen from './ProcessingScreen'

describe('ProcessingScreen — AI-assisted parsing fallback', () => {
  beforeEach(() => {
    useResumeStore.getState().reset()
    useAnalysisStore.getState().reset()
    useEditorStore.getState().reset()
    useVersionsStore.getState().reset()
    // Any stray AI call (e.g. the bullet-rewrite queue) fails fast and falls back.
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))
    useResumeStore.getState().setFile(new File(['x'], 'resume.pdf', { type: 'application/pdf' }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('waits for the fallback before running ATS analysis or navigating, then analyzes the merged Resume', async () => {
    const onNav = vi.fn()
    render(<ProcessingScreen onNav={onNav} />)

    await waitFor(() => expect(assistResumeParse).toHaveBeenCalled(), { timeout: 3000 })
    expect(await screen.findByText('verifying with AI')).toBeInTheDocument()

    // Give the screen ample time to (wrongly) move on while the fallback is pending.
    await new Promise((r) => setTimeout(r, 1200))
    expect(useAnalysisStore.getState().status).toBe('idle')
    expect(onNav).not.toHaveBeenCalledWith('dashboard')

    const deterministic = useResumeStore.getState().resume!
    const merged = {
      ...deterministic,
      experience: [{ ...deterministic.experience[0]!, title: 'Staff Software Engineer', company: 'Globex Corporation' }],
    }
    resolveAssist({ ok: true, data: { resume: merged, status: 'applied', filledFields: ['experience.exp-0.company'] } })

    await waitFor(() => expect(onNav).toHaveBeenCalledWith('dashboard'), { timeout: 10000 })
    expect(useResumeStore.getState().resume).toBe(merged)
    // The analysis and the saved original version were built from the merged Resume, not the pre-fallback one.
    expect(useVersionsStore.getState().versions[0]?.resume.experience[0]?.company).toBe('Globex Corporation')
  }, 20000)
})
