import type { View } from '../App'
import { ScoreRing, ProgressBar, EvidenceList } from './shared'
import { useResumeStore } from '@/stores/resumeStore'
import { useAnalysisStore } from '@/stores/analysisStore'
import { useJobDescriptionStore } from '@/stores/jobDescriptionStore'
import { useMatchStore } from '@/stores/matchStore'
import { JD_MATCH_CATEGORY_LABELS } from '@/features/job-description/jdMatchDisplay'
import { formatContribution } from '@/lib/scoring/scoreComponents'

interface Props {
  onNav: (v: View) => void
}

const SAMPLE_JD = `Senior Frontend Engineer

We're looking for a Senior Frontend Engineer to join our product team.

Requirements
5+ years of frontend experience
Required Skills: React, TypeScript, REST API, AWS, CI/CD

Preferred Qualifications
Preferred Skills: GraphQL, Next.js, Docker

Responsibilities
Build and maintain customer-facing web applications.
Collaborate with design and product on new features.

Education
Bachelor's degree in Computer Science or equivalent experience`

export default function JDMatch({ onNav }: Props) {
  const { resume } = useResumeStore()
  const { atsResult } = useAnalysisStore()
  const { text, setText, parseText, parseFile, jobDescription, status: jdStatus, error: jdError } = useJobDescriptionStore()
  const { analysis, result, status: matchStatus, error: matchError, match } = useMatchStore()

  const loading = jdStatus === 'parsing' || matchStatus === 'matching'
  const analyzed = matchStatus === 'ready' && result !== null

  if (!resume || !atsResult) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <h1 className="font-serif text-2xl text-foreground mb-2">Analyze your resume first</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Upload and analyze a resume before matching it against a job description.
          </p>
          <button
            onClick={() => onNav('upload')}
            className="px-6 py-3 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors"
          >
            Upload a resume
          </button>
        </div>
      </div>
    )
  }

  const handleAnalyze = async () => {
    if (!text.trim()) return
    await parseText()
    const parsedJd = useJobDescriptionStore.getState().jobDescription
    if (useJobDescriptionStore.getState().status === 'error' || !parsedJd) return
    await match(resume, parsedJd, atsResult.score)
  }

  const handleFileUpload = async (file: File) => {
    await parseFile(file)
    const parsedJd = useJobDescriptionStore.getState().jobDescription
    if (useJobDescriptionStore.getState().status === 'error' || !parsedJd) return
    await match(resume, parsedJd, atsResult.score)
  }

  const loadSample = () => setText(SAMPLE_JD)
  const error = jdError ?? matchError

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
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"Paste the job description here..."}
              rows={14}
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none leading-relaxed"
            />

            {error && <p className="mt-3 text-xs text-critical font-medium">{error}</p>}

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleAnalyze}
                disabled={!text.trim() || loading}
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
                <input
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file)
                  }}
                />
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

        {analyzed && result && (
          <div className="space-y-5">
            {/* Match score */}
            <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-6">
              <ScoreRing score={result.score} size={100} strokeWidth={8} />
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Job Match Score</div>
                <div className="font-semibold text-foreground mb-1">{jobDescription?.title ?? 'This role'}</div>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                  {result.score >= 85
                    ? 'Strong alignment across skills, experience, and requirements.'
                    : result.score >= 60
                    ? 'Reasonable alignment, with some skills or requirements not evidenced in your resume.'
                    : 'Limited alignment — several required skills or requirements are not evidenced in your resume.'}
                </p>
              </div>
            </div>

            {/* Breakdown */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold text-foreground mb-1">Match Breakdown</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Each component's own score, and how many points it contributes to the {result.score}/100 total.
              </p>
              <div className="space-y-3.5">
                {result.breakdown.map((component) => (
                  <div key={component.category}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm text-foreground">
                        {JD_MATCH_CATEGORY_LABELS[component.category]}
                        <span className="ml-2 font-mono text-[10px] text-muted-foreground">{Math.round(component.weight * 100)}% weight</span>
                      </span>
                      <span className="font-mono text-sm font-semibold text-foreground">{component.rawScore}%</span>
                    </div>
                    <ProgressBar value={component.rawScore} />
                    <div className="flex justify-between gap-3 mt-1">
                      <span className="text-[11px] text-muted-foreground leading-snug">{component.explanation}</span>
                      <span className="font-mono text-[10px] text-muted-foreground flex-shrink-0">{formatContribution(component)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hard requirements — reported independently of the score (spec §11/§29): a
          missing hard requirement must never disappear inside an overall number. */}
      {analyzed && analysis && analysis.hardRequirements.length > 0 && (
        <div className="mt-8 bg-card border border-border rounded-2xl p-6">
          <div className="mb-4">
            <h2 className="font-semibold text-foreground">Hard Requirements</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Pass/fail requirements shown on their own — never averaged away by a good overall score.
            </p>
          </div>
          <div className="space-y-2">
            {analysis.hardRequirements.map((req) => (
              <div
                key={req.id}
                className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${
                  req.satisfied ? 'bg-success-bg/40 border-success/20' : 'bg-critical-bg/40 border-critical/20'
                }`}
              >
                {req.satisfied ? (
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className="mt-0.5 flex-shrink-0">
                    <path d="M2 6l3 3 5-5" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className="mt-0.5 flex-shrink-0">
                    <path d="M2 2l8 8M10 2L2 10" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground">{req.requirementText}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{req.reason}</div>
                  {req.evidence.length > 0 && (
                    <div className="mt-1.5">
                      <EvidenceList evidence={req.evidence} max={1} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skill matching */}
      {analyzed && result && analysis && (
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
                {result.matched.length === 0 && <p className="text-xs text-muted-foreground">None yet.</p>}
                {result.matched.map((s) => (
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
                {result.missing.length === 0 && <p className="text-xs text-muted-foreground">None.</p>}
                {result.missing.map((s) => (
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
                {result.partial.length === 0 && <p className="text-xs text-muted-foreground">None.</p>}
                {result.partial.map((s) => (
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
