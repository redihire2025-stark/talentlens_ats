import { useState, useEffect } from 'react'
import type { View } from '../App'

interface Props {
  onNav: (v: View) => void
}

const steps = [
  { label: 'Reading resume', duration: 600 },
  { label: 'Extracting sections', duration: 800 },
  { label: 'Identifying skills', duration: 700 },
  { label: 'Analyzing experience', duration: 900 },
  { label: 'Checking ATS compatibility', duration: 1000 },
  { label: 'Preparing recommendations', duration: 800 },
]

export default function ProcessingScreen({ onNav }: Props) {
  const [completed, setCompleted] = useState(0)
  const [active, setActive] = useState(0)

  useEffect(() => {
    let idx = 0
    const advance = () => {
      if (idx >= steps.length) {
        setTimeout(() => onNav('dashboard'), 600)
        return
      }
      setActive(idx)
      setTimeout(() => {
        setCompleted(idx + 1)
        idx++
        advance()
      }, steps[idx].duration)
    }
    const t = setTimeout(advance, 400)
    return () => clearTimeout(t)
  }, [onNav])

  const progress = Math.round((completed / steps.length) * 100)

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Animated logo */}
        <div className="flex justify-center mb-10">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#E6E3DD" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="34"
                fill="none"
                stroke="#14B8A6"
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
          {steps.map((step, i) => {
            const done = i < completed
            const current = i === active && !done
            return (
              <div
                key={step.label}
                className={`flex items-center gap-3 py-1.5 transition-all duration-300 ${
                  done ? 'opacity-100' : current ? 'opacity-100' : 'opacity-35'
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
