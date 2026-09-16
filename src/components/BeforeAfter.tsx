import type { View } from '../App'
import { ScoreRing } from './shared'

interface Props {
  onNav: (v: View) => void
}

const originalBullets = [
  'Built React applications.',
  'Worked with team to improve performance.',
  'Used AWS for cloud deployments.',
  'Wrote documentation for the codebase.',
]

const optimizedBullets = [
  'Built reusable React components used across multiple production applications, reducing development time by 30%.',
  'Led performance optimization initiative, reducing core load time by 45% across key user flows.',
  'Deployed and maintained cloud infrastructure on AWS (EC2, S3, CloudFront), supporting 500K+ monthly active users.',
  'Authored comprehensive technical documentation adopted across a team of 12 engineers.',
]

export default function BeforeAfter({ onNav }: Props) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-foreground mb-2">Before / After Comparison</h1>
        <p className="text-muted-foreground text-sm">See what changed and how it affects your score.</p>
      </div>

      {/* Score comparison */}
      <div className="grid grid-cols-2 gap-4 max-w-md mb-8">
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <div className="text-xs font-medium text-muted-foreground mb-3">Original Score</div>
          <ScoreRing score={82} size={80} strokeWidth={7} />
        </div>
        <div className="bg-card border border-success/30 bg-success-bg/10 rounded-xl p-5 text-center">
          <div className="text-xs font-medium text-muted-foreground mb-3">Optimized Score</div>
          <ScoreRing score={89} size={80} strokeWidth={7} />
        </div>
      </div>

      {/* Side by side content */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Original */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40" />
              <span className="text-sm font-semibold text-foreground">Original Resume</span>
            </div>
            <span className="font-mono text-xs text-muted-foreground">Score: 82</span>
          </div>
          <div className="p-5">
            {/* Resume skeleton */}
            <div className="mb-5">
              <div className="h-5 bg-foreground rounded w-48 mb-1" />
              <div className="h-3 bg-muted rounded w-64" />
            </div>
            <div className="mb-4">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Experience</div>
              <div className="font-semibold text-sm text-foreground mb-1">Senior Frontend Engineer — Acme Corp</div>
              <div className="text-xs text-muted-foreground mb-2">2021 – Present</div>
              <ul className="space-y-1.5">
                {originalBullets.map((b) => (
                  <li key={b} className="flex gap-2 text-xs text-foreground leading-relaxed">
                    <span className="text-muted-foreground mt-0.5">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Skills</div>
              <div className="text-xs text-foreground leading-relaxed">React · TypeScript · JavaScript · REST APIs · AWS</div>
            </div>
          </div>
        </div>

        {/* Optimized */}
        <div className="bg-card border border-success/25 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-success/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-success" />
              <span className="text-sm font-semibold text-foreground">Optimized Resume</span>
            </div>
            <span className="font-mono text-xs text-success">Score: 89</span>
          </div>
          <div className="p-5">
            <div className="mb-5">
              <div className="h-5 bg-foreground rounded w-48 mb-1" />
              <div className="h-3 bg-muted rounded w-64" />
            </div>
            <div className="mb-4">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Experience</div>
              <div className="font-semibold text-sm text-foreground mb-1">Senior Frontend Engineer — Acme Corp</div>
              <div className="text-xs text-muted-foreground mb-2">2021 – Present</div>
              <ul className="space-y-1.5">
                {optimizedBullets.map((b) => (
                  <li key={b} className="flex gap-2 text-xs leading-relaxed">
                    <span className="text-muted-foreground mt-0.5">•</span>
                    <span className="bg-success-bg/50 text-foreground rounded px-0.5">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Skills</div>
              <div className="text-xs text-foreground leading-relaxed">React · TypeScript · JavaScript · REST APIs · AWS · GraphQL</div>
            </div>
          </div>
        </div>
      </div>

      {/* Change summary */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <h2 className="font-semibold text-foreground mb-4">Changes Summary</h2>
        <div className="space-y-2">
          {[
            'Strengthened 4 experience bullet points with measurable outcomes',
            'Added quantified impact to AWS infrastructure bullet',
            'Expanded summary to include years of experience and key technologies',
            'Added GraphQL to skills section',
          ].map((c) => (
            <div key={c} className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-success-bg flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1 4l2 2 4-4" stroke="#059669" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-sm text-foreground leading-relaxed">{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onNav('editor')}
          className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors"
        >
          Continue Editing
        </button>
        <button
          onClick={() => onNav('editor')}
          className="px-5 py-2.5 border border-border text-foreground text-sm font-medium rounded-xl hover:bg-muted transition-colors"
        >
          Revert Changes
        </button>
        <button
          onClick={() => onNav('dashboard')}
          className="px-5 py-2.5 border border-border text-foreground text-sm font-medium rounded-xl hover:bg-muted transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  )
}
