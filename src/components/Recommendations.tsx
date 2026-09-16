import { useState } from 'react'
import type { View } from '../App'

interface Props {
  onNav: (v: View) => void
}

type RecStatus = 'pending' | 'accepted' | 'rejected' | 'editing'

interface Rec {
  id: number
  category: string
  section: string
  current: string
  suggested: string
  impact: string
  impactValue: string
  status: RecStatus
  editValue?: string
}

const initialRecs: Rec[] = [
  {
    id: 1,
    category: 'Content Impact',
    section: 'Experience',
    current: 'Built React applications.',
    suggested: 'Built reusable React components used across multiple production applications, reducing development time by 30%.',
    impact: 'ATS relevance',
    impactValue: '+4',
    status: 'pending',
  },
  {
    id: 2,
    category: 'Keywords',
    section: 'Summary',
    current: 'Experienced software engineer with frontend focus.',
    suggested: 'Senior Frontend Engineer with 6 years of experience building scalable React and TypeScript applications in production environments.',
    impact: 'Keyword coverage',
    impactValue: '+6',
    status: 'pending',
  },
  {
    id: 3,
    category: 'Content Impact',
    section: 'Experience',
    current: 'Worked with the team to improve performance.',
    suggested: 'Collaborated with cross-functional teams to optimize application performance, reducing load time by 45% across core user flows.',
    impact: 'Content quality',
    impactValue: '+3',
    status: 'pending',
  },
  {
    id: 4,
    category: 'Skills Evidence',
    section: 'Experience',
    current: 'Used AWS for cloud deployments.',
    suggested: 'Deployed and maintained cloud infrastructure on AWS (EC2, S3, CloudFront), supporting 500K+ monthly active users.',
    impact: 'Skills evidence',
    impactValue: '+5',
    status: 'pending',
  },
]

export default function Recommendations({ onNav }: Props) {
  const [recs, setRecs] = useState<Rec[]>(initialRecs)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all')

  const update = (id: number, patch: Partial<Rec>) =>
    setRecs((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  const filtered = recs.filter((r) => filter === 'all' || r.status === filter)
  const accepted = recs.filter((r) => r.status === 'accepted').length
  const pending = recs.filter((r) => r.status === 'pending').length

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-foreground mb-2">Recommendations</h1>
          <p className="text-muted-foreground text-sm">
            Evidence-based suggestions to improve your resume. You control every change.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onNav('editor')}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors"
          >
            Open Editor
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pending', value: pending, color: 'text-warning' },
          { label: 'Accepted', value: accepted, color: 'text-success' },
          { label: 'Total', value: recs.length, color: 'text-foreground' },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <div className={`font-mono text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl mb-6 w-fit">
        {(['all', 'pending', 'accepted', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
              filter === f
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {filtered.map((rec) => (
          <div
            key={rec.id}
            className={`bg-card border rounded-2xl p-6 transition-all ${
              rec.status === 'accepted'
                ? 'border-success/30 bg-success-bg/10'
                : rec.status === 'rejected'
                ? 'border-border opacity-50'
                : 'border-border'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 bg-secondary text-secondary-foreground text-xs font-medium rounded-full">
                  {rec.category}
                </span>
                <span className="text-xs text-muted-foreground">{rec.section}</span>
              </div>
              {rec.status === 'accepted' && (
                <span className="flex items-center gap-1.5 text-xs text-success font-medium">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Accepted
                </span>
              )}
              {rec.status === 'rejected' && (
                <span className="text-xs text-muted-foreground">Rejected</span>
              )}
            </div>

            {/* Before/after */}
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-muted/60 rounded-xl border border-border">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Current</div>
                <p className="text-sm text-foreground leading-relaxed">{rec.current}</p>
              </div>
              <div className="p-3 bg-secondary/50 rounded-xl border border-primary/10">
                <div className="text-[10px] font-semibold text-secondary-foreground uppercase tracking-wider mb-1.5">Suggested</div>
                {rec.status === 'editing' ? (
                  <textarea
                    value={rec.editValue ?? rec.suggested}
                    onChange={(e) => update(rec.id, { editValue: e.target.value })}
                    rows={4}
                    className="w-full text-sm bg-card border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                ) : (
                  <p className="text-sm text-foreground leading-relaxed">{rec.editValue ?? rec.suggested}</p>
                )}
              </div>
            </div>

            {/* Impact */}
            <div className="flex items-center gap-2 mb-4">
              <div className="px-2.5 py-1 bg-success-bg rounded-lg flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 8V2M2 5l3-3 3 3" stroke="#16A34A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-xs font-medium text-success">Potential improvement</span>
              </div>
              <span className="font-mono text-xs font-semibold text-success">{rec.impact} {rec.impactValue}</span>
              <span className="text-xs text-muted-foreground ml-1">estimated — not a guarantee</span>
            </div>

            {/* Actions */}
            {rec.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  onClick={() => update(rec.id, { status: 'accepted' })}
                  className="px-4 py-2 bg-success text-white text-xs font-medium rounded-lg hover:bg-success/90 transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={() => update(rec.id, { status: 'rejected' })}
                  className="px-4 py-2 bg-muted text-foreground text-xs font-medium rounded-lg hover:bg-muted/80 transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => update(rec.id, { status: 'editing', editValue: rec.suggested })}
                  className="px-4 py-2 border border-border text-foreground text-xs font-medium rounded-lg hover:bg-muted transition-colors"
                >
                  Edit
                </button>
              </div>
            )}

            {rec.status === 'editing' && (
              <div className="flex gap-2">
                <button
                  onClick={() => update(rec.id, { status: 'accepted' })}
                  className="px-4 py-2 bg-success text-white text-xs font-medium rounded-lg hover:bg-success/90 transition-colors"
                >
                  Save & Accept
                </button>
                <button
                  onClick={() => update(rec.id, { status: 'pending', editValue: undefined })}
                  className="px-4 py-2 bg-muted text-foreground text-xs font-medium rounded-lg hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            {(rec.status === 'accepted' || rec.status === 'rejected') && (
              <button
                onClick={() => update(rec.id, { status: 'pending' })}
                className="text-xs text-accent hover:underline"
              >
                Undo
              </button>
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      {accepted > 0 && (
        <div className="mt-8 p-5 bg-success-bg border border-success/20 rounded-2xl flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-foreground text-sm">{accepted} recommendation{accepted > 1 ? 's' : ''} accepted</p>
            <p className="text-xs text-muted-foreground mt-0.5">Open the editor to apply these changes and see your updated score.</p>
          </div>
          <button
            onClick={() => onNav('editor')}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors flex-shrink-0"
          >
            Apply in Editor
          </button>
        </div>
      )}
    </div>
  )
}
