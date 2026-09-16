import { useEffect, useState } from 'react'
import type { View } from '../App'
import { useResumeStore } from '@/stores/resumeStore'
import { useAnalysisStore } from '@/stores/analysisStore'
import { useMatchStore } from '@/stores/matchStore'
import { useEditorStore } from '@/stores/editorStore'
import { getRecommendations } from '@/api/recommendations'

interface Props {
  onNav: (v: View) => void
}

export default function Recommendations({ onNav }: Props) {
  const { resume, warnings } = useResumeStore()
  const { analysis: matchAnalysis } = useMatchStore()
  const { recommendations, statuses, editedTexts, load, setEditedText, acceptRecommendation, rejectRecommendation, resetRecommendation } =
    useEditorStore()
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!resume || recommendations.length > 0) return
    setLoading(true)
    getRecommendations({ resume, parserWarnings: warnings, matchAnalysis: matchAnalysis ?? undefined }).then((result) => {
      setLoading(false)
      if (result.ok) load(resume, result.data.recommendations)
    })
  }, [resume, warnings, matchAnalysis, recommendations.length, load])

  if (!resume) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <h1 className="font-serif text-2xl text-foreground mb-2">No resume to review yet</h1>
          <p className="text-muted-foreground text-sm mb-8">Upload and analyze a resume to see recommendations.</p>
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

  if (loading || recommendations.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
        <div className="text-center">
          {loading ? (
            <>
              <div className="w-12 h-12 rounded-full border-4 border-secondary border-t-accent animate-spin mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Generating recommendations...</p>
            </>
          ) : (
            <>
              <h1 className="font-serif text-2xl text-foreground mb-2">Nothing to flag</h1>
              <p className="text-muted-foreground text-sm">This resume looks solid — no recommendations right now.</p>
            </>
          )}
        </div>
      </div>
    )
  }

  const filtered = recommendations.filter((r) => filter === 'all' || statuses[r.id] === filter)
  const accepted = recommendations.filter((r) => statuses[r.id] === 'accepted').length
  const pending = recommendations.filter((r) => statuses[r.id] === 'pending').length

  const handleAccept = (id: string) => {
    acceptRecommendation(id)
    setEditingId(null)
  }

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
          { label: 'Total', value: recommendations.length, color: 'text-foreground' },
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
        {filtered.map((rec) => {
          const status = statuses[rec.id] ?? 'pending'
          const isEditing = editingId === rec.id

          return (
            <div
              key={rec.id}
              className={`bg-card border rounded-2xl p-6 transition-all ${
                status === 'accepted'
                  ? 'border-success/30 bg-success-bg/10'
                  : status === 'rejected'
                  ? 'border-border opacity-50'
                  : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 bg-secondary text-secondary-foreground text-xs font-medium rounded-full">
                    {rec.impact.metric}
                  </span>
                  <span className="text-xs text-muted-foreground">{rec.title}</span>
                </div>
                {status === 'accepted' && (
                  <span className="flex items-center gap-1.5 text-xs text-success font-medium">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Accepted
                  </span>
                )}
                {status === 'rejected' && <span className="text-xs text-muted-foreground">Rejected</span>}
              </div>

              {rec.currentText && (
                <div className="p-3 bg-muted/60 rounded-xl border border-border mb-4">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Current</div>
                  <p className="text-sm text-foreground leading-relaxed">{rec.currentText}</p>
                </div>
              )}

              {/* Only bullet-level recommendations have a location to apply a replacement to — everything
                  else (missing sections, skill gaps, title mismatches) has nothing for Accept to swap in,
                  so it never gets a "Suggested" box or an editable textarea here. */}
              {rec.location && (isEditing || rec.suggestedText) && (
                <div className="p-3 bg-success-bg/40 rounded-xl border border-success/20 mb-4">
                  <div className="text-[10px] font-semibold text-success uppercase tracking-wider mb-1.5">
                    {isEditing ? 'Your replacement' : 'Suggested replacement'}
                  </div>
                  {isEditing ? (
                    <textarea
                      value={editedTexts[rec.id] ?? rec.suggestedText ?? rec.currentText ?? ''}
                      onChange={(e) => setEditedText(rec.id, e.target.value)}
                      rows={3}
                      autoFocus
                      className="w-full text-sm bg-card border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  ) : (
                    <p className="text-sm text-foreground leading-relaxed">{rec.suggestedText}</p>
                  )}
                </div>
              )}

              <div className="p-3 bg-secondary/50 rounded-xl border border-primary/10 mb-4">
                <div className="text-[10px] font-semibold text-secondary-foreground uppercase tracking-wider mb-1.5">Guidance</div>
                <p className="text-sm text-foreground leading-relaxed">{rec.guidance}</p>
              </div>

              {/* Impact */}
              <div className="flex items-center gap-2 mb-4">
                <div className="px-2.5 py-1 bg-success-bg rounded-lg flex items-center gap-1.5">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5 8V2M2 5l3-3 3 3" stroke="#10B981" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-xs font-medium text-success">Potential improvement</span>
                </div>
                <span className="font-mono text-xs font-semibold text-success">{rec.impact.metric} +{rec.impact.delta}</span>
                <span className="text-xs text-muted-foreground ml-1">estimated — not a guarantee</span>
              </div>

              {/* Actions */}
              {status === 'pending' && !isEditing && (
                <div className="flex gap-2">
                  {/* A location-less recommendation (missing section, skill gap, title mismatch) has
                      nothing for Accept to apply — it just checks the item off. A location-having one
                      with no suggestedText (e.g. "add a metric") can't be safely auto-applied either,
                      since we never invent numbers — so it requires writing the replacement via Edit
                      before Accept does anything. Only show a bare Accept when it will actually apply
                      something: no location, or a location with a ready suggestion. */}
                  {(!rec.location || rec.suggestedText) && (
                    <button
                      onClick={() => handleAccept(rec.id)}
                      className="px-4 py-2 bg-success text-white text-xs font-medium rounded-lg hover:bg-success/90 transition-colors"
                    >
                      {rec.suggestedText ? 'Accept suggestion' : 'Accept'}
                    </button>
                  )}
                  <button
                    onClick={() => rejectRecommendation(rec.id)}
                    className="px-4 py-2 bg-muted text-foreground text-xs font-medium rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    Reject
                  </button>
                  {rec.location && (
                    <button
                      onClick={() => setEditingId(rec.id)}
                      className="px-4 py-2 border border-border text-foreground text-xs font-medium rounded-lg hover:bg-muted transition-colors"
                    >
                      {rec.suggestedText ? 'Edit suggestion' : 'Write your own'}
                    </button>
                  )}
                </div>
              )}

              {isEditing && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(rec.id)}
                    className="px-4 py-2 bg-success text-white text-xs font-medium rounded-lg hover:bg-success/90 transition-colors"
                  >
                    Save & Accept
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-4 py-2 bg-muted text-foreground text-xs font-medium rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {(status === 'accepted' || status === 'rejected') && (
                <button onClick={() => resetRecommendation(rec.id)} className="text-xs text-accent hover:underline">
                  Undo
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* CTA */}
      {accepted > 0 && (
        <div className="mt-8 p-5 bg-success-bg border border-success/20 rounded-2xl flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-foreground text-sm">{accepted} recommendation{accepted > 1 ? 's' : ''} accepted</p>
            <p className="text-xs text-muted-foreground mt-0.5">Open the editor to see your updated score.</p>
          </div>
          <button
            onClick={() => onNav('editor')}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors flex-shrink-0"
          >
            Open Editor
          </button>
        </div>
      )}
    </div>
  )
}
