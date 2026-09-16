import type { View } from '../App'
import { ScoreRing, ProgressBar, StatusBadge } from './shared'
import { useResumeStore } from '@/stores/resumeStore'
import { useAnalysisStore } from '@/stores/analysisStore'
import { ATS_SCORE_CATEGORIES } from '@/lib/ats/types'
import {
  ATS_CATEGORY_LABELS,
  ATS_HEALTH_CARD_LABELS,
  explanationForCategory,
  scoreToHealthStatus,
} from '@/features/ats-analysis/atsCategoryDisplay'

interface Props {
  onNav: (v: View) => void
  onExport: () => void
}

export default function ATSDashboard({ onNav, onExport }: Props) {
  const { file } = useResumeStore()
  const { atsResult } = useAnalysisStore()

  if (!atsResult) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <h1 className="font-serif text-2xl text-foreground mb-2">No analysis yet</h1>
          <p className="text-muted-foreground text-sm mb-8">Upload a resume to see your ATS Compatibility Score.</p>
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

  const breakdown = ATS_SCORE_CATEGORIES.map((category) => ({
    category,
    label: ATS_CATEGORY_LABELS[category],
    value: atsResult.breakdown[category],
    desc: explanationForCategory(atsResult.explanations, category),
  }))

  const healthCards = ATS_SCORE_CATEGORIES.map((category) => {
    const score = atsResult.breakdown[category]
    return {
      category,
      title: ATS_HEALTH_CARD_LABELS[category],
      status: scoreToHealthStatus(score),
      score,
      detail: explanationForCategory(atsResult.explanations, category),
    }
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
        <span>{file?.name ?? 'your resume'}</span>
        <span>·</span>
        <span className="text-foreground font-medium">ATS Analysis</span>
      </div>

      {/* Top actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl text-foreground">ATS Score Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">{file?.name ?? 'your resume'} — analyzed just now</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onNav('jd-match')}
            className="px-4 py-2 border border-border text-sm font-medium text-foreground rounded-xl hover:bg-muted transition-colors"
          >
            Match With a Job
          </button>
          <button
            onClick={onExport}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors"
          >
            Export Resume
          </button>
        </div>
      </div>

      {/* Hero score + breakdown */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Score card */}
        <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center text-center">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-5">ATS Compatibility</div>
          <ScoreRing score={atsResult.score} size={140} strokeWidth={10} />
          <p className="text-sm text-muted-foreground leading-relaxed mt-5 max-w-[220px]">
            {atsResult.score >= 85
              ? 'Your resume is highly compatible with common ATS-style parsing and screening requirements.'
              : atsResult.score >= 70
              ? 'Your resume is reasonably compatible, with a few areas that could be strengthened.'
              : 'Your resume has several gaps that could affect ATS-style parsing and screening.'}
          </p>
          <button
            onClick={() => onNav('recommendations')}
            className="mt-5 w-full py-2.5 bg-secondary text-secondary-foreground text-sm font-medium rounded-xl hover:bg-secondary/80 transition-colors"
          >
            View Recommendations
          </button>
        </div>

        {/* Breakdown */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
          <h2 className="font-semibold text-foreground mb-5">Score Breakdown</h2>
          <div className="space-y-4">
            {breakdown.map((item) => (
              <div key={item.category}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-foreground font-medium">{item.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground hidden sm:block">{item.desc}</span>
                    <span className="font-mono text-sm font-semibold text-foreground w-10 text-right">{item.value}%</span>
                  </div>
                </div>
                <ProgressBar value={item.value} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resume Health */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-foreground text-lg">Resume Health</h2>
          <button
            onClick={() => onNav('editor')}
            className="text-sm text-accent hover:underline"
          >
            Open Editor
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {healthCards.map((card) => (
            <div key={card.category} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-foreground">{card.title}</h3>
                <StatusBadge status={card.status} />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <ProgressBar value={card.score} height={4} />
                <span className="font-mono text-xs font-semibold text-foreground flex-shrink-0">{card.score}%</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{card.detail}</p>
              <button
                onClick={() => onNav('recommendations')}
                className="text-xs text-accent hover:underline font-medium"
              >
                View details
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <button
          onClick={() => onNav('jd-match')}
          className="bg-secondary hover:bg-secondary/80 rounded-xl p-5 text-left transition-colors group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8h12M8 2v12" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="font-medium text-sm text-foreground">Match With a Job</span>
          </div>
          <p className="text-xs text-muted-foreground">Paste a job description to see how your resume aligns.</p>
        </button>

        <button
          onClick={() => onNav('recommendations')}
          className="bg-secondary hover:bg-secondary/80 rounded-xl p-5 text-left transition-colors"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 4h10M3 8h7M3 12h5" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="font-medium text-sm text-foreground">View Recommendations</span>
          </div>
          <p className="text-xs text-muted-foreground">Evidence-based suggestions to strengthen your resume.</p>
        </button>

        <button
          onClick={() => onNav('editor')}
          className="bg-secondary hover:bg-secondary/80 rounded-xl p-5 text-left transition-colors"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M11 2l3 3-9 9H2v-3l9-9z" stroke="#A855F7" strokeWidth="1.3" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-medium text-sm text-foreground">Open Editor</span>
          </div>
          <p className="text-xs text-muted-foreground">Edit your resume and see your score update live.</p>
        </button>
      </div>
    </div>
  )
}
