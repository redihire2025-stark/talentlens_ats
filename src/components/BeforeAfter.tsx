import type { View } from '../App'
import { ScoreRing } from './shared'
import { useVersionsStore } from '@/stores/versionsStore'
import { useEditorStore } from '@/stores/editorStore'
import { diffScoreBreakdown } from '@/lib/scoring/explainScoreChange'
import { ATS_CATEGORY_LABELS } from '@/features/ats-analysis/atsCategoryDisplay'
import { JD_MATCH_CATEGORY_LABELS } from '@/features/job-description/jdMatchDisplay'

interface Props {
  onNav: (v: View) => void
}

export default function BeforeAfter({ onNav }: Props) {
  const { versions, activeVersionId } = useVersionsStore()
  const { setDraft } = useEditorStore()

  const original = versions.find((v) => v.id === 'original')
  const saved = versions.filter((v) => v.id !== 'original')
  const comparison = versions.find((v) => v.id === activeVersionId && v.id !== 'original') ?? saved[saved.length - 1]

  if (!original || !comparison) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <h1 className="font-serif text-2xl text-foreground mb-2">Nothing to compare yet</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Make some edits in the Resume Editor and save a version to see a before/after comparison.
          </p>
          <button
            onClick={() => onNav('editor')}
            className="px-6 py-3 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors"
          >
            Open Editor
          </button>
        </div>
      </div>
    )
  }

  const originalExperience = original.resume.experience
  const comparisonExperience = comparison.resume.experience

  const revertToOriginal = () => setDraft(original.resume)

  // Spec §48: a score change is never shown as just "64 → 71" — it's broken
  // down into which components moved and by how much. Both diffs are
  // optional (older snapshots saved before this field existed, or a JD
  // that wasn't active for one/both versions, have no breakdown to compare).
  const atsChanges =
    original.scoreSnapshot.atsBreakdown && comparison.scoreSnapshot.atsBreakdown
      ? diffScoreBreakdown(original.scoreSnapshot.atsBreakdown, comparison.scoreSnapshot.atsBreakdown, ATS_CATEGORY_LABELS)
      : []
  const jdMatchChanges =
    original.scoreSnapshot.jdMatchBreakdown && comparison.scoreSnapshot.jdMatchBreakdown
      ? diffScoreBreakdown(original.scoreSnapshot.jdMatchBreakdown, comparison.scoreSnapshot.jdMatchBreakdown, JD_MATCH_CATEGORY_LABELS)
      : []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-foreground mb-2">Before / After Comparison</h1>
        <p className="text-muted-foreground text-sm">Comparing Original to {comparison.label}.</p>
      </div>

      {/* Score comparison */}
      <div className="grid grid-cols-2 gap-4 max-w-md mb-8">
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <div className="text-xs font-medium text-muted-foreground mb-3">Original Score</div>
          <ScoreRing score={original.scoreSnapshot.ats} size={80} strokeWidth={7} />
        </div>
        <div className="bg-card border border-success/30 bg-success-bg/10 rounded-xl p-5 text-center">
          <div className="text-xs font-medium text-muted-foreground mb-3">{comparison.label} Score</div>
          <ScoreRing score={comparison.scoreSnapshot.ats} size={80} strokeWidth={7} />
        </div>
      </div>

      {/* Why the score changed (spec §48) — a component-level breakdown, never just the two numbers. */}
      {(atsChanges.length > 0 || jdMatchChanges.length > 0) && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-8 max-w-2xl">
          <h2 className="font-semibold text-foreground mb-4">Why the score changed</h2>
          {atsChanges.length > 0 && (
            <div className="mb-4 last:mb-0">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Resume Health</div>
              <div className="flex flex-wrap gap-2">
                {atsChanges.map((c) => (
                  <span
                    key={c.category}
                    className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-full ${
                      c.delta > 0 ? 'bg-success-bg text-success' : 'bg-critical-bg text-critical'
                    }`}
                  >
                    {c.delta > 0 ? '+' : ''}
                    {c.delta} {c.label}
                    <span className="ml-1 font-normal opacity-75">
                      ({c.weightedDelta > 0 ? '+' : ''}
                      {c.weightedDelta.toFixed(1)} pts overall)
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
          {jdMatchChanges.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Job Match</div>
              <div className="flex flex-wrap gap-2">
                {jdMatchChanges.map((c) => (
                  <span
                    key={c.category}
                    className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-full ${
                      c.delta > 0 ? 'bg-success-bg text-success' : 'bg-critical-bg text-critical'
                    }`}
                  >
                    {c.delta > 0 ? '+' : ''}
                    {c.delta} {c.label}
                    <span className="ml-1 font-normal opacity-75">
                      ({c.weightedDelta > 0 ? '+' : ''}
                      {c.weightedDelta.toFixed(1)} pts overall)
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Side by side content */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Original */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40" />
              <span className="text-sm font-semibold text-foreground">Original Resume</span>
            </div>
            <span className="font-mono text-xs text-muted-foreground">Score: {original.scoreSnapshot.ats}</span>
          </div>
          <div className="p-5 space-y-4">
            {originalExperience.map((entry, i) => (
              <div key={entry.id}>
                <div className="font-semibold text-sm text-foreground mb-1">{entry.title} — {entry.company}</div>
                <ul className="space-y-1.5">
                  {entry.bullets.map((b, bi) => {
                    const changed = comparisonExperience[i]?.bullets[bi]?.text !== b.text
                    return (
                      <li key={b.id} className={`flex gap-2 text-xs leading-relaxed ${changed ? 'text-muted-foreground' : 'text-foreground'}`}>
                        <span className="mt-0.5">•</span>
                        <span>{b.text}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Skills</div>
              <div className="text-xs text-foreground leading-relaxed">{original.resume.skills.map((s) => s.rawName).join(' · ')}</div>
            </div>
          </div>
        </div>

        {/* Comparison */}
        <div className="bg-card border border-success/25 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-success/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-success" />
              <span className="text-sm font-semibold text-foreground">{comparison.label}</span>
            </div>
            <span className="font-mono text-xs text-success">Score: {comparison.scoreSnapshot.ats}</span>
          </div>
          <div className="p-5 space-y-4">
            {comparisonExperience.map((entry, i) => (
              <div key={entry.id}>
                <div className="font-semibold text-sm text-foreground mb-1">{entry.title} — {entry.company}</div>
                <ul className="space-y-1.5">
                  {entry.bullets.map((b, bi) => {
                    const changed = originalExperience[i]?.bullets[bi]?.text !== b.text
                    return (
                      <li key={b.id} className="flex gap-2 text-xs leading-relaxed">
                        <span className="text-muted-foreground mt-0.5">•</span>
                        <span className={changed ? 'bg-success-bg/50 text-foreground rounded px-0.5' : 'text-foreground'}>{b.text}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Skills</div>
              <div className="text-xs text-foreground leading-relaxed">{comparison.resume.skills.map((s) => s.rawName).join(' · ')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Change summary */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <h2 className="font-semibold text-foreground mb-4">Changes Summary</h2>
        {comparison.changes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No changes were recorded for this version.</p>
        ) : (
          <div className="space-y-2">
            {comparison.changes.map((c) => (
              <div key={c} className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-success-bg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1 4l2 2 4-4" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-sm text-foreground leading-relaxed">{c}</span>
              </div>
            ))}
          </div>
        )}
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
          onClick={() => {
            revertToOriginal()
            onNav('editor')
          }}
          className="px-5 py-2.5 border border-border text-foreground text-sm font-medium rounded-xl hover:bg-muted transition-colors"
        >
          Revert to Original
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
