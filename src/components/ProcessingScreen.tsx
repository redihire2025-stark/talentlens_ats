import { useEffect, useState } from 'react'
import type { View } from '../App'
import { useResumeStore } from '@/stores/resumeStore'
import { useAnalysisStore } from '@/stores/analysisStore'
import { useVersionsStore } from '@/stores/versionsStore'
import { useEditorStore } from '@/stores/editorStore'
import { getRecommendations } from '@/api/recommendations'

interface Props {
  onNav: (v: View) => void
}

const STEPS = [
  { label: 'Reading resume', minDuration: 500 },
  { label: 'Extracting sections', minDuration: 500 },
  { label: 'Identifying skills', minDuration: 500 },
  { label: 'Analyzing experience', minDuration: 500 },
  { label: 'Checking Resume Health / ATS Readiness', minDuration: 600 },
  { label: 'Preparing recommendations', minDuration: 400 },
  { label: 'Drafting AI-assisted suggestions', minDuration: 300 },
]

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default function ProcessingScreen({ onNav }: Props) {
  const [completed, setCompleted] = useState(0)
  const [failure, setFailure] = useState<string | null>(null)

  const { file, parse, assistParse } = useResumeStore()
  const aiAssistRunning = useResumeStore((s) => s.aiAssistStatus === 'running')
  const { analyze } = useAnalysisStore()
  const aiQueuedIds = useEditorStore((s) => s.aiQueuedIds)
  const aiLoadingIds = useEditorStore((s) => s.aiLoadingIds)
  const aiRemaining = Object.keys(aiQueuedIds).length + Object.values(aiLoadingIds).filter(Boolean).length

  useEffect(() => {
    if (!file) {
      onNav('upload')
      return
    }

    // Resets so a re-run (including React StrictMode's dev-only double-invoke
    // of this effect, which cancels the first run almost immediately) starts
    // clean rather than resuming mid-animation.
    setCompleted(0)
    setFailure(null)
    let cancelled = false

    const run = async () => {
      // Steps 1-2 correspond to parsing the file into structured Resume JSON.
      await wait(STEPS[0].minDuration)
      if (cancelled) return
      setCompleted(1)

      await parse()
      if (cancelled) return

      if (useResumeStore.getState().status === 'error' || !useResumeStore.getState().resume) {
        setFailure(useResumeStore.getState().error ?? 'This resume could not be parsed.')
        return
      }

      // Still within "Extracting sections": the AI-assisted parsing
      // fallback. It returns immediately (no network call) when the
      // deterministic parse raised no structural warning; otherwise stay on
      // this step until the verified AI fill has finished or failed, so the
      // ATS analysis below — and the dashboard after it — only ever see the
      // final parse. Never fails the upload: on any error the deterministic
      // Resume is kept.
      await assistParse()
      if (cancelled) return

      const parsedResume = useResumeStore.getState().resume
      if (!parsedResume) {
        setFailure('This resume could not be parsed.')
        return
      }
      setCompleted(2)

      // Steps 3-5 correspond to the deterministic ATS analysis.
      await wait(STEPS[2].minDuration)
      if (cancelled) return
      setCompleted(3)

      await wait(STEPS[3].minDuration)
      if (cancelled) return
      setCompleted(4)

      await analyze(parsedResume, useResumeStore.getState().warnings)
      if (cancelled) return

      if (useAnalysisStore.getState().status === 'error') {
        setFailure(useAnalysisStore.getState().error ?? 'Analysis failed unexpectedly.')
        return
      }
      setCompleted(5)

      const atsResult = useAnalysisStore.getState().atsResult
      if (atsResult) {
        useVersionsStore.getState().initOriginal(parsedResume, atsResult.score, atsResult.breakdown)
      }

      // Generate recommendations now — during "Preparing recommendations" —
      // rather than lazily when the user opens that screen, so the list is
      // fully ready before the user ever sees it. A job description hasn't
      // been supplied yet at this point (it's optional and comes later),
      // so JD-dependent recommendations aren't included yet; the
      // Recommendations screen already regenerates once a JD match exists.
      const parserWarnings = useResumeStore.getState().warnings
      const recsResult = await getRecommendations({ resume: parsedResume, parserWarnings })
      if (cancelled) return

      await wait(STEPS[5].minDuration)
      if (cancelled) return
      setCompleted(6)

      // Stay on this screen — don't navigate to the dashboard — until every
      // AI-drafted rewrite has actually finished (or failed and silently
      // fell back to its deterministic suggestion), so the user never sees
      // "Queued for an AI-drafted rewrite…" appear live on the
      // Recommendations screen itself.
      if (recsResult.ok) {
        useEditorStore.getState().load(parsedResume, recsResult.data.recommendations)
        await useEditorStore.getState().startAiUpgrades(parsedResume)
        if (cancelled) return
      }

      await wait(STEPS[6].minDuration)
      if (cancelled) return
      setCompleted(7)

      await wait(400)
      if (cancelled) return
      onNav('dashboard')
    }

    run()

    return () => {
      cancelled = true
    }
  }, [file, onNav, parse, assistParse, analyze])

  if (failure) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-critical-bg mx-auto mb-6 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 8v5M12 16h.01" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="12" r="9" stroke="#DC2626" strokeWidth="2" />
            </svg>
          </div>
          <h1 className="font-serif text-2xl text-foreground mb-2">We couldn't process that resume</h1>
          <p className="text-muted-foreground text-sm mb-8">{failure}</p>
          <button
            onClick={() => onNav('upload')}
            className="px-6 py-3 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors"
          >
            Try a different file
          </button>
        </div>
      </div>
    )
  }

  const progress = Math.round((completed / STEPS.length) * 100)

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Animated logo */}
        <div className="flex justify-center mb-10">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#1F1F2E" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="34"
                fill="none"
                stroke="#7C3AED"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
                style={{ transition: 'stroke-dashoffset 0.4s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-sm font-semibold text-foreground">{progress}%</span>
            </div>
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl text-foreground mb-2">Analyzing your resume</h1>
          <p className="text-muted-foreground text-sm">This takes a few seconds</p>
        </div>

        {/* Steps */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
          {STEPS.map((step, i) => {
            const done = i < completed
            const current = i === completed
            return (
              <div
                key={step.label}
                className={`flex items-center gap-3 py-1.5 transition-all duration-300 ${
                  done || current ? 'opacity-100' : 'opacity-35'
                }`}
              >
                <div className="w-5 h-5 flex-shrink-0">
                  {done ? (
                    <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  ) : current ? (
                    <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-border" />
                  )}
                </div>
                <span
                  className={`text-sm font-medium transition-colors ${
                    done ? 'text-foreground' : current ? 'text-accent' : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </span>
                {done && (
                  <span className="ml-auto font-mono text-xs text-success">done</span>
                )}
                {current && step.label === 'Extracting sections' && aiAssistRunning && (
                  <span className="ml-auto font-mono text-xs text-muted-foreground">verifying with AI</span>
                )}
                {current && step.label === 'Drafting AI-assisted suggestions' && aiRemaining > 0 && (
                  <span className="ml-auto font-mono text-xs text-muted-foreground">{aiRemaining} left</span>
                )}
              </div>
            )
          })}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Each step reflects real analysis of your resume structure, content, and compatibility signals.
        </p>
      </div>
    </div>
  )
}
