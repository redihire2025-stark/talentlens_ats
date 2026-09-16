import { useEffect, useState } from 'react'
import type { View } from '../App'
import { ScoreRing, ProgressBar } from './shared'
import { useResumeStore } from '@/stores/resumeStore'
import { useJobDescriptionStore } from '@/stores/jobDescriptionStore'
import { useEditorStore } from '@/stores/editorStore'
import { useVersionsStore } from '@/stores/versionsStore'
import { ATS_SCORE_CATEGORIES } from '@/lib/ats/types'
import { ATS_CATEGORY_LABELS } from '@/features/ats-analysis/atsCategoryDisplay'

interface Props {
  onNav: (v: View) => void
  onExport: () => void
}

type Section = 'contact' | 'summary' | 'skills' | 'experience' | 'education' | 'projects' | 'certifications'

const SECTIONS: Array<{ id: Section; label: string }> = [
  { id: 'contact', label: 'Contact' },
  { id: 'summary', label: 'Summary' },
  { id: 'skills', label: 'Skills' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'projects', label: 'Projects' },
  { id: 'certifications', label: 'Certifications' },
]

export default function ResumeEditor({ onNav, onExport }: Props) {
  const [activeSection, setActiveSection] = useState<Section>('experience')
  const { file, warnings } = useResumeStore()
  const { jobDescription } = useJobDescriptionStore()
  const {
    draftResume,
    originalResume,
    liveAtsResult,
    liveJdMatchResult,
    ensureDraft,
    updateSummaryText,
    updateSkills,
    updateExperienceBullet,
    updateExperienceTitle,
    updateExperienceCompany,
    recalculate,
    setDraft,
  } = useEditorStore()
  const { versions, activeVersionId, saveVersion, selectVersion } = useVersionsStore()

  useEffect(() => {
    if (useResumeStore.getState().resume) ensureDraft(useResumeStore.getState().resume!)
  }, [ensureDraft])

  useEffect(() => {
    if (draftResume) recalculate(warnings, jobDescription ?? undefined)
  }, [draftResume, warnings, jobDescription, recalculate])

  if (!draftResume || !originalResume) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <h1 className="font-serif text-2xl text-foreground mb-2">No resume to edit yet</h1>
          <p className="text-muted-foreground text-sm mb-8">Upload and analyze a resume first.</p>
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

  const edited = JSON.stringify(draftResume) !== JSON.stringify(originalResume)
  const atsScore = liveAtsResult?.score ?? 0

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Toolbar */}
      <div className="border-b border-border bg-card px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">Resume Editor</span>
          <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-md font-mono">{file?.name ?? 'resume'}</span>
          {edited && (
            <span className="px-2 py-0.5 bg-warning-bg text-warning text-xs rounded-md font-medium">Unsaved changes</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const label = `Version ${versions.filter((v) => v.id !== 'original').length + 1}`
              saveVersion(label, draftResume, liveAtsResult?.score ?? 0, liveJdMatchResult?.score ?? null)
            }}
            disabled={!edited}
            className="px-3 py-1.5 border border-border text-xs font-medium text-foreground rounded-lg hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save Version
          </button>
          <button
            onClick={() => onNav('before-after')}
            className="px-3 py-1.5 border border-border text-xs font-medium text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            Before / After
          </button>
          <button
            onClick={onExport}
            className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            Export
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Section nav */}
        <div className="w-44 flex-shrink-0 border-r border-border bg-muted/30 overflow-y-auto py-4 px-2 hidden sm:block">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5 ${
                activeSection === s.id
                  ? 'bg-card border border-border text-foreground font-medium shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card'
              }`}
            >
              {s.label}
            </button>
          ))}

          {versions.length > 0 && (
            <div className="mt-4 px-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Versions</div>
              {versions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    const resume = selectVersion(v.id)
                    if (resume) setDraft(resume)
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg mb-1 text-xs transition-colors ${
                    v.id === activeVersionId
                      ? 'bg-secondary text-secondary-foreground font-medium'
                      : 'text-muted-foreground hover:bg-card'
                  }`}
                >
                  {v.label}
                  <span className="ml-1.5 font-mono text-[10px] opacity-70">{v.scoreSnapshot.ats}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground">{SECTIONS.find((s) => s.id === activeSection)?.label}</h2>
              <button onClick={() => onNav('recommendations')} className="text-xs text-accent hover:underline">
                View recommendations
              </button>
            </div>

            {activeSection === 'contact' && (
              <div className="bg-card border border-border rounded-xl px-5 py-4 text-sm text-foreground space-y-1.5">
                <p>{draftResume.candidate.name ?? <span className="text-muted-foreground">No name found</span>}</p>
                <p className="text-muted-foreground">{draftResume.candidate.email ?? 'No email found'}</p>
                <p className="text-muted-foreground">{draftResume.candidate.phone ?? 'No phone found'}</p>
                <p className="text-muted-foreground">{draftResume.candidate.location ?? 'No location found'}</p>
                {draftResume.candidate.links.map((link) => (
                  <p key={link.url} className="text-muted-foreground">{link.url}</p>
                ))}
                <p className="text-xs text-muted-foreground pt-2">Contact editing isn't available yet — this shows what was parsed.</p>
              </div>
            )}

            {activeSection === 'summary' && (
              <>
                <textarea
                  value={draftResume.summary ?? ''}
                  onChange={(e) => updateSummaryText(e.target.value)}
                  rows={6}
                  placeholder="Add a short professional summary in your own words."
                  className="w-full bg-card border border-border rounded-xl px-5 py-4 text-sm text-foreground leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                <p className="mt-2 text-xs text-muted-foreground">Edit directly. Changes are reflected in the live score panel.</p>
              </>
            )}

            {activeSection === 'skills' && (
              <>
                <textarea
                  value={draftResume.skills.map((s) => s.name).join(', ')}
                  onChange={(e) => updateSkills(e.target.value.split(','))}
                  rows={4}
                  placeholder="React, TypeScript, AWS"
                  className="w-full bg-card border border-border rounded-xl px-5 py-4 text-sm text-foreground leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                <p className="mt-2 text-xs text-muted-foreground">Comma-separated. Only list skills you genuinely have.</p>
              </>
            )}

            {activeSection === 'experience' && (
              <div className="space-y-6">
                {draftResume.experience.map((entry, entryIndex) => (
                  <div key={entryIndex} className="bg-card border border-border rounded-xl p-4">
                    <div className="grid sm:grid-cols-2 gap-2 mb-3">
                      <input
                        value={entry.title}
                        onChange={(e) => updateExperienceTitle(entryIndex, e.target.value)}
                        placeholder="Title"
                        className="bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <input
                        value={entry.company}
                        onChange={(e) => updateExperienceCompany(entryIndex, e.target.value)}
                        placeholder="Company"
                        className="bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="space-y-2">
                      {entry.bullets.map((bullet, bulletIndex) => (
                        <textarea
                          key={bulletIndex}
                          value={bullet}
                          onChange={(e) => updateExperienceBullet(entryIndex, bulletIndex, e.target.value)}
                          rows={2}
                          className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        />
                      ))}
                      {entry.bullets.length === 0 && (
                        <p className="text-xs text-muted-foreground">No bullet points for this role.</p>
                      )}
                    </div>
                  </div>
                ))}
                {draftResume.experience.length === 0 && (
                  <p className="text-sm text-muted-foreground">No experience entries were found.</p>
                )}
              </div>
            )}

            {activeSection === 'education' && (
              <div className="space-y-3">
                {draftResume.education.map((entry, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl px-5 py-4 text-sm">
                    <p className="text-foreground font-medium">{entry.institution}</p>
                    <p className="text-muted-foreground">{entry.degree}{entry.fieldOfStudy ? `, ${entry.fieldOfStudy}` : ''}</p>
                  </div>
                ))}
                {draftResume.education.length === 0 && <p className="text-sm text-muted-foreground">No education entries were found.</p>}
                <p className="text-xs text-muted-foreground">Education editing isn't available yet — this shows what was parsed.</p>
              </div>
            )}

            {activeSection === 'projects' && (
              <div className="space-y-3">
                {draftResume.projects.map((project, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl px-5 py-4 text-sm">
                    <p className="text-foreground font-medium">{project.name}</p>
                    {project.description && <p className="text-muted-foreground mt-1">{project.description}</p>}
                  </div>
                ))}
                {draftResume.projects.length === 0 && <p className="text-sm text-muted-foreground">No projects were found.</p>}
              </div>
            )}

            {activeSection === 'certifications' && (
              <div className="space-y-3">
                {draftResume.certifications.map((cert, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl px-5 py-4 text-sm">
                    <p className="text-foreground font-medium">{cert.name}</p>
                    {cert.issuer && <p className="text-muted-foreground">{cert.issuer}</p>}
                  </div>
                ))}
                {draftResume.certifications.length === 0 && (
                  <p className="text-sm text-muted-foreground">No certifications were found.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Live score panel */}
        <div className="w-56 flex-shrink-0 border-l border-border bg-muted/20 overflow-y-auto py-5 px-4 hidden lg:block">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-5">Live Score</div>

          <div className="space-y-5">
            {/* ATS score */}
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <ScoreRing score={atsScore} size={80} strokeWidth={7} />
              <div className="text-xs font-medium text-foreground mt-2.5">ATS Compatibility</div>
              {edited && <div className="font-mono text-[10px] text-warning mt-1">unsaved edit</div>}
            </div>

            {/* JD match */}
            {liveJdMatchResult ? (
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <ScoreRing score={liveJdMatchResult.score} size={80} strokeWidth={7} />
                <div className="text-xs font-medium text-foreground mt-2.5">JD Match</div>
              </div>
            ) : (
              <button
                onClick={() => onNav('jd-match')}
                className="w-full bg-card border border-dashed border-border rounded-xl p-4 text-center text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                Match with a job to see this score
              </button>
            )}

            {/* Mini breakdown */}
            {liveAtsResult && (
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-xs font-medium text-foreground mb-3">Score factors</div>
                <div className="space-y-2.5">
                  {ATS_SCORE_CATEGORIES.map((category) => (
                    <div key={category}>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-muted-foreground">{ATS_CATEGORY_LABELS[category]}</span>
                        <span className="font-mono text-foreground">{liveAtsResult.breakdown[category]}%</span>
                      </div>
                      <ProgressBar value={liveAtsResult.breakdown[category]} height={4} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
