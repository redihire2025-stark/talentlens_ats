import { useEffect, useRef, useState } from 'react'
import type { View } from '../App'
import { useResumeStore } from '@/stores/resumeStore'
import { useAnalysisStore } from '@/stores/analysisStore'
import { useMatchStore } from '@/stores/matchStore'
import { useEditorStore } from '@/stores/editorStore'
import { getRecommendations } from '@/api/recommendations'
import type { Recommendation, RecommendationCategory } from '@/lib/recommendations/types'
import { EvidenceList } from './shared'

interface Props {
  onNav: (v: View) => void
}

// Groups recommendations the same way a resume reader thinks about their
// document — by section — rather than one long undifferentiated list, so
// "what needs work in my Experience section" vs. "in my Skills section" is
// immediately visible instead of requiring the user to scan every card.
const SECTION_LABELS: Record<RecommendationCategory, string> = {
  'missing-section': 'Resume Structure',
  'bullet-impact': 'Experience',
  'skill-evidence': 'Skills',
  'skill-not-demonstrated': 'Skills',
  'title-alignment': 'Job Title',
  formatting: 'Formatting',
  // Spec §55's UI grouping list puts hard requirement failures, experience,
  // responsibility and education gaps under "Critical Requirements" —
  // distinct from "Job Match"'s skill-level recommendations above, since a
  // hard requirement must never look like just another suggestion.
  'hard-requirement-gap': 'Critical Requirements',
  'experience-gap': 'Critical Requirements',
  'responsibility-gap': 'Critical Requirements',
  'education-gap': 'Critical Requirements',
}
const SECTION_ORDER = ['Critical Requirements', 'Resume Structure', 'Experience', 'Skills', 'Job Title', 'Formatting']

function groupBySection(recommendations: Recommendation[]): { section: string; items: Recommendation[] }[] {
  const bySection = new Map<string, Recommendation[]>()
  for (const rec of recommendations) {
    const section = SECTION_LABELS[rec.category]
    if (!bySection.has(section)) bySection.set(section, [])
    bySection.get(section)!.push(rec)
  }
  return SECTION_ORDER.filter((section) => bySection.has(section)).map((section) => ({
    section,
    items: bySection.get(section)!,
  }))
}

export default function Recommendations({ onNav }: Props) {
  const { resume, warnings } = useResumeStore()
  const { analysis: matchAnalysis } = useMatchStore()
  const {
    recommendations,
    statuses,
    editedTexts,
    aiSuggestions,
    aiLoadingIds,
    aiQueuedIds,
    load,
    setEditedText,
    acceptRecommendation,
    rejectRecommendation,
    resetRecommendation,
    startAiUpgrades,
    requestAiSuggestion,
  } = useEditorStore()
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  // Tracks whether the current recommendation list already reflects a JD
  // match (title-alignment recommendations need one). The processing screen
  // generates the deterministic list before a JD is ever supplied, so once
  // the user adds one, this triggers exactly one regeneration to pick up
  // JD-dependent recommendations — not a refetch on every render.
  const generatedWithMatchRef = useRef(false)

  // Recommendations are normally already generated (and their AI upgrades
  // already running or done) by the processing screen before this screen is
  // ever reached — see ProcessingScreen.tsx. This effect only has real work
  // to do if: the user opened this screen directly (recommendations.length
  // === 0), or a job description was just added and JD-dependent
  // recommendations haven't been generated yet.
  useEffect(() => {
    if (!resume) return
    const needsInitialLoad = recommendations.length === 0
    const needsMatchRegeneration = Boolean(matchAnalysis) && !generatedWithMatchRef.current
    if (!needsInitialLoad && !needsMatchRegeneration) return

    setLoading(true)
    getRecommendations({ resume, parserWarnings: warnings, matchAnalysis: matchAnalysis ?? undefined }).then((result) => {
      setLoading(false)
      if (!result.ok) return
      load(resume, result.data.recommendations)
      if (matchAnalysis) generatedWithMatchRef.current = true
      startAiUpgrades(resume)
    })
  }, [resume, warnings, matchAnalysis, recommendations.length, load, startAiUpgrades])

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

  const filtered = recommendations.filter((r) => {
    if (filter === 'all') return true
    // "edited" (PRD §15 status) is an accepted change with user-written text — grouped with "accepted" in this filter.
    if (filter === 'accepted') return statuses[r.id] === 'accepted' || statuses[r.id] === 'edited'
    return statuses[r.id] === filter
  })
  const grouped = groupBySection(filtered)
  const accepted = recommendations.filter((r) => statuses[r.id] === 'accepted' || statuses[r.id] === 'edited').length
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
      <div className="flex gap-1 bg-muted p-1 rounded-xl mb-8 w-fit">
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

      {/* Section groups */}
      {grouped.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">No {filter !== 'all' ? filter : ''} recommendations.</p>
        </div>
      )}
      <div className="space-y-10">
        {grouped.map(({ section, items }) => (
          <div key={section}>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-serif text-xl text-foreground">{section}</h2>
              <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs font-mono rounded-full">{items.length}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-4">
              {items.map((rec) => {
                const status = statuses[rec.id] ?? 'pending'
                const isEditing = editingId === rec.id
                // The AI-drafted rewrite (once it lands) upgrades the deterministic
                // suggestedChange, which is always present already — the card
                // never shows a blank "no suggestion" state either way.
                const suggestionText = aiSuggestions[rec.id] ?? rec.suggestedChange
                const isAiSuggestion = Boolean(aiSuggestions[rec.id])
                const isAiLoading = Boolean(aiLoadingIds[rec.id])
                const isAiQueued = Boolean(aiQueuedIds[rec.id])
                // Only checklist-style recommendations (no location — a missing
                // section, a skill gap, a title mismatch) show the guidance/
                // explanation text as their primary content; a bullet-level
                // recommendation already shows a concrete suggested replacement,
                // so a separate generic-advice box would be redundant.
                const showGuidance = !rec.location

                return (
                  <div
                    key={rec.id}
                    className={`bg-card border rounded-2xl p-6 transition-all ${
                      status === 'accepted' || status === 'edited'
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
                      {(status === 'accepted' || status === 'edited') && (
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

                    {/* Evidence behind a recommendation that doesn't quote a single bullet (a listed-only
                        skill's skills-list line, a role's title line, what the resume shows for an unmet
                        requirement). Recommendations about something the resume lacks have none. */}
                    {!rec.currentText && rec.evidence.length > 0 && (
                      <div className="p-3 bg-muted/40 rounded-xl border border-border mb-4">
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Evidence in your resume</div>
                        <EvidenceList evidence={rec.evidence} max={3} />
                      </div>
                    )}

                    {/* Only bullet-level recommendations have a location to apply a replacement to — everything
                        else (missing sections, skill gaps, title mismatches) has nothing for Accept to swap in,
                        so it never gets a "Suggested" box or an editable textarea here. */}
                    {rec.location && (
                      <div className="p-3 bg-success-bg/40 rounded-xl border border-success/20 mb-4">
                        <div className="text-[10px] font-semibold text-success uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          {isEditing ? 'Your replacement' : 'Suggested replacement'}
                          {isAiSuggestion && !isEditing && <span className="normal-case text-accent">✨ AI-drafted, unverified</span>}
                        </div>
                        {isEditing ? (
                          <textarea
                            value={editedTexts[rec.id] ?? suggestionText ?? rec.currentText ?? ''}
                            onChange={(e) => setEditedText(rec.id, e.target.value)}
                            rows={3}
                            autoFocus
                            className="w-full text-sm bg-card border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                          />
                        ) : (
                          <p className="text-sm text-foreground leading-relaxed">{suggestionText}</p>
                        )}
                        {!isEditing && (isAiLoading || isAiQueued) && (
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" />
                            {isAiLoading ? 'Checking for a stronger AI-drafted rewrite…' : 'Queued for an AI-drafted rewrite…'}
                          </p>
                        )}
                      </div>
                    )}

                    {showGuidance && (
                      <div className="p-3 bg-secondary/50 rounded-xl border border-primary/10 mb-4">
                        <div className="text-[10px] font-semibold text-secondary-foreground uppercase tracking-wider mb-1.5">Guidance</div>
                        <p className="text-sm text-foreground leading-relaxed">{rec.explanation}</p>
                      </div>
                    )}
                    {rec.location && isAiSuggestion && (
                      <p className="text-xs text-muted-foreground mb-4">
                        The suggestion above was drafted by AI — review it for accuracy before accepting.
                      </p>
                    )}

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
                      <div className="flex flex-wrap items-center gap-2">
                        {/* A location-less recommendation (missing section, skill gap, title mismatch) has
                            nothing for Accept to apply — it just checks the item off. Every location-having
                            one now always has a suggestionText (deterministic, possibly AI-upgraded), so
                            Accept is always available once there's something to apply. */}
                        {(!rec.location || suggestionText) && (
                          <button
                            onClick={() => handleAccept(rec.id)}
                            className="px-4 py-2 bg-success text-white text-xs font-medium rounded-lg hover:bg-success/90 transition-colors"
                          >
                            {suggestionText ? 'Accept suggestion' : 'Accept'}
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
                            {suggestionText ? 'Edit suggestion' : 'Write your own'}
                          </button>
                        )}
                        {rec.location && !isAiLoading && !isAiQueued && (
                          <button
                            onClick={() => requestAiSuggestion(rec, resume)}
                            className="px-4 py-2 border border-accent/40 text-accent text-xs font-medium rounded-lg hover:bg-accent/10 transition-colors"
                          >
                            {isAiSuggestion ? '🔁 Regenerate' : '✨ Try an AI rewrite'}
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

                    {(status === 'accepted' || status === 'edited' || status === 'rejected') && (
                      <button onClick={() => resetRecommendation(rec.id)} className="text-xs text-accent hover:underline">
                        Undo
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
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
