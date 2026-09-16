import { useState } from 'react'
import type { View } from '../App'
import { ScoreRing, ProgressBar } from './shared'

interface Props {
  onNav: (v: View) => void
}

const matchBreakdown = [
  { label: 'Required Skills', value: 92 },
  { label: 'Preferred Skills', value: 71 },
  { label: 'Experience', value: 96 },
  { label: 'Responsibilities', value: 83 },
  { label: 'Job Title', value: 90 },
  { label: 'Education', value: 100 },
]

const matchedSkills = ['React', 'TypeScript', 'JavaScript', 'REST APIs', 'AWS']
const missingSkills = ['Next.js', 'Docker']
const partialSkills = ['GraphQL', 'CI/CD']

const sampleJD = `Senior Frontend Engineer

We're looking for a Senior Frontend Engineer to join our product team.

Requirements:
- 5+ years of frontend experience
- Expert-level React and TypeScript
- Experience with REST APIs and GraphQL
- AWS cloud infrastructure knowledge
- CI/CD pipeline experience
- Next.js and Docker familiarity

Nice to have:
- Open source contributions
- Experience with design systems`

export default function JDMatch({ onNav }: Props) {
  const [jdText, setJdText] = useState('')
  const [analyzed, setAnalyzed] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAnalyze = () => {
    if (!jdText.trim()) return
    setLoading(true)
    setTimeout(() => { setLoading(false); setAnalyzed(true) }, 1800)
  }

  const loadSample = () => setJdText(sampleJD)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-foreground mb-2">How well does your resume match this job?</h1>
        <p className="text-muted-foreground text-sm">Paste a job description to see alignment across skills, experience, and requirements.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input */}
        <div>
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Job Description</h2>
              <button onClick={loadSample} className="text-xs text-accent hover:underline">Load sample</button>
            </div>

            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder={"Paste the job description here..."}
              rows={14}
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none leading-relaxed"
            />

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleAnalyze}
                disabled={!jdText.trim() || loading}
                className="flex-1 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Analyzing...' : 'Analyze Match'}
              </button>
              <label className="flex items-center gap-2 px-4 py-2.5 border border-border text-sm text-muted-foreground rounded-xl hover:bg-muted cursor-pointer transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 9V3M4 6l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                Upload JD
                <input type="file" accept=".pdf,.docx,.txt" className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* Results */}
        {!analyzed && !loading && (
          <div className="flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M9 14h10M14 9v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-sm font-medium text-foreground mb-1">Paste a job description</p>
              <p className="text-xs text-muted-foreground">Results will appear here after analysis.</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full border-4 border-secondary border-t-accent animate-spin mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Comparing resume to job description...</p>
            </div>
          </div>
        )}

        {analyzed && (
          <div className="space-y-5">
            {/* Match score */}
            <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-6">
              <ScoreRing score={84} size={100} strokeWidth={8} />
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">JD Match Score</div>
                <div className="font-semibold text-foreground mb-1">Senior Frontend Engineer</div>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                  Strong alignment on experience and required skills. A few preferred skills are not evidenced in your resume.
                </p>
              </div>
            </div>

            {/* Breakdown */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold text-foreground mb-4">Match Breakdown</h3>
              <div className="space-y-3.5">
                {matchBreakdown.map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm text-foreground">{item.label}</span>
                      <span className="font-mono text-sm font-semibold text-foreground">{item.value}%</span>
                    </div>
                    <ProgressBar value={item.value} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Skill matching */}
      {analyzed && (
        <div className="mt-8 bg-card border border-border rounded-2xl p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="font-semibold text-foreground">Skills Alignment</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Missing skills should only be added if you genuinely have that experience — never fabricate skills on a resume.
              </p>
            </div>
            <button
              onClick={() => onNav('recommendations')}
              className="px-4 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              View Recommendations
            </button>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-success" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Matched</span>
              </div>
              <div className="space-y-2">
                {matchedSkills.map((s) => (
                  <div key={s} className="flex items-center gap-2 px-3 py-2 bg-success-bg rounded-lg">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-sm text-foreground font-medium">{s}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-critical" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Not evidenced</span>
              </div>
              <div className="space-y-2">
                {missingSkills.map((s) => (
                  <div key={s} className="flex items-center gap-2 px-3 py-2 bg-critical-bg rounded-lg">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 2l8 8M10 2L2 10" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span className="text-sm text-foreground font-medium">{s}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-warning" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Partial evidence</span>
              </div>
              <div className="space-y-2">
                {partialSkills.map((s) => (
                  <div key={s} className="flex items-center gap-2 px-3 py-2 bg-warning-bg rounded-lg">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 2v5M6 9v.5" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span className="text-sm text-foreground font-medium">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 p-4 bg-warning-bg/50 border border-warning/20 rounded-xl">
            <p className="text-xs text-warning font-medium">
              Important: Only add skills to your resume if you genuinely have that experience. Listing skills you cannot substantiate in an interview is not recommended.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
