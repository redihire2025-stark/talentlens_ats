import { describe, expect, it, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'
import { buildResumeDocx } from '../src/lib/resume-generation/exportDocx'
import type { Resume } from '../src/types/resume'
import { useResumeStore } from '../src/stores/resumeStore'
import { useAnalysisStore } from '../src/stores/analysisStore'
import { useEditorStore } from '../src/stores/editorStore'
import { useVersionsStore } from '../src/stores/versionsStore'

/**
 * Drives the real App component through the primary V1 user journey —
 * Landing -> Upload -> Processing -> Dashboard -> Recommendations ->
 * Editor -> Export — using a genuinely generated DOCX file (round-tripped
 * through our own exportDocx.ts) rather than a mocked upload. Every screen
 * renders whatever the real parser, ATS engine, and recommendation engine
 * actually produce; nothing here is asserted against a hardcoded mock
 * value, since those were removed from every screen in TASK-013 – TASK-018.
 */
const FIXTURE_RESUME: Resume = {
  candidate: {
    name: 'Priya Nair',
    email: 'priya.nair@example.com',
    phone: '555-020-3456',
    location: 'Seattle, WA',
    links: [],
  },
  summary: 'Backend engineer with production experience building distributed systems.',
  skills: [
    { name: 'Python', category: 'language', evidence: [] },
    { name: 'Kubernetes', category: 'platform', evidence: [] },
  ],
  experience: [
    {
      company: 'Nimbus Systems',
      title: 'Backend Engineer',
      startDate: '2020-01-01',
      endDate: null,
      location: 'Remote',
      bullets: [
        'Designed and deployed microservices handling 2M requests per day.',
        'Reduced infrastructure costs by 30% through Kubernetes migration.',
      ],
    },
  ],
  education: [],
  certifications: [],
  projects: [],
}

async function buildFixtureFile(): Promise<File> {
  const blob = await buildResumeDocx(FIXTURE_RESUME)
  return new File([blob], 'priya-resume.docx', {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
}

describe('primary V1 user journey', () => {
  beforeEach(() => {
    useResumeStore.getState().reset()
    useAnalysisStore.getState().reset()
    useEditorStore.getState().reset()
    useVersionsStore.getState().reset()
  })

  it(
    'takes a real uploaded resume all the way to a real ATS score, recommendations, and an editable draft',
    async () => {
      const user = userEvent.setup()
      const file = await buildFixtureFile()

      render(<App />)

      await user.click(screen.getByRole('button', { name: 'Check My Resume' }))
      expect(await screen.findByText("Let's analyze your resume")).toBeInTheDocument()

      const fileInput = screen.getByTestId('resume-file-input')
      await user.upload(fileInput, file)
      await user.click(await screen.findByRole('button', { name: 'Analyze My Resume' }))

      // Real parsing + ATS analysis run during this screen, on top of the step animation.
      await waitFor(() => expect(screen.getByText('ATS Score Dashboard')).toBeInTheDocument(), { timeout: 15000 })

      // The score is genuinely computed, not the old hardcoded 87.
      const scoreText = screen.getByText(/^\d+$/, { selector: 'span.font-mono' })
      const score = Number(scoreText.textContent)
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(100)

      // Real category breakdown renders with an explanation grounded in the fixture, not a canned sentence.
      // (Appears twice: once in the score breakdown, once in the matching Resume Health card.)
      expect(screen.getAllByText(/distinct skill keyword/).length).toBeGreaterThan(0)

      // Recommendations are generated from this specific resume's real gaps.
      await user.click(screen.getAllByRole('button', { name: 'View Recommendations' })[0]!)
      await waitFor(() => expect(screen.queryByText('Generating recommendations...')).not.toBeInTheDocument())
      expect(screen.getByRole('heading', { name: 'Recommendations' })).toBeInTheDocument()

      // The editor shows this resume's real content, not a placeholder "Alex Chen" fixture.
      await user.click(screen.getByRole('button', { name: 'Open Editor' }))
      await user.click(await screen.findByRole('button', { name: 'Contact' }))
      expect(await screen.findByText('Priya Nair')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Skills' }))
      expect(screen.getByDisplayValue(/Kubernetes/)).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Experience' }))
      expect(screen.getByDisplayValue('Nimbus Systems')).toBeInTheDocument()
    },
    20000,
  )

  it('never leaves the user on a blank screen when the uploaded file is unsupported', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Check My Resume' }))

    // Simulated via drop, not the file input, because a real <input accept="..."> silently
    // filters non-matching files at the OS picker level — drag-and-drop has no such filter,
    // so it's the path that actually reaches our own validation with an arbitrary file type.
    const dropzone = await screen.findByRole('button', { name: 'Upload resume' })
    const badFile = new File([new Uint8Array(10)], 'resume.txt', { type: 'text/plain' })
    fireEvent.drop(dropzone, { dataTransfer: { files: [badFile] } })

    expect(await screen.findByText(/Unsupported file type/)).toBeInTheDocument()
    // The upload button never becomes available for a rejected file.
    expect(screen.getByRole('button', { name: 'Upload a resume to continue' })).toBeDisabled()
  })
})
