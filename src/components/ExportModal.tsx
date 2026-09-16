import { useState } from 'react'
import type { View } from '../App'
import { useResumeStore } from '@/stores/resumeStore'
import { useEditorStore } from '@/stores/editorStore'
import { useVersionsStore } from '@/stores/versionsStore'
import { useAnalysisStore } from '@/stores/analysisStore'
import { useMatchStore } from '@/stores/matchStore'
import { exportResume, type ExportFormat } from '@/api/resumeExport'

interface Props {
  onClose: () => void
  onNav: (v: View) => void
}

export default function ExportModal({ onClose, onNav }: Props) {
  const { resume: originalResume } = useResumeStore()
  const { draftResume } = useEditorStore()
  const { versions } = useVersionsStore()
  const { atsResult } = useAnalysisStore()
  const { result: matchResult } = useMatchStore()
  const [downloading, setDownloading] = useState<ExportFormat | null>(null)
  const [error, setError] = useState<string | null>(null)

  const resume = draftResume ?? originalResume
  const original = versions.find((v) => v.id === 'original')
  const latestVersion = [...versions].reverse().find((v) => v.id !== 'original')
  const currentAtsScore = latestVersion?.scoreSnapshot.ats ?? atsResult?.score

  const handleDownload = async (format: ExportFormat) => {
    if (!resume) return
    setDownloading(format)
    setError(null)

    const result = await exportResume({ resume, format })
    setDownloading(null)

    if (!result.ok) {
      setError(result.error.message)
      return
    }

    const url = URL.createObjectURL(result.data.blob)
    const link = document.createElement('a')
    link.href = url
    link.download = result.data.filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-serif text-2xl text-foreground mb-1">Your resume is ready</h2>
            <p className="text-sm text-muted-foreground">
              Download your resume in your preferred format.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Score summary */}
        {currentAtsScore !== undefined && (
          <div className="bg-success-bg border border-success/20 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7l4 4 6-7" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {latestVersion ? latestVersion.label : 'Current resume'}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                ATS Score: {original && original.scoreSnapshot.ats !== currentAtsScore ? `${original.scoreSnapshot.ats} → ` : ''}
                {currentAtsScore}
                {matchResult ? ` · JD Match: ${matchResult.score}` : ''}
              </p>
            </div>
          </div>
        )}

        {error && <p className="mb-4 text-xs text-critical font-medium">{error}</p>}

        {/* Download options */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleDownload('pdf')}
            disabled={!resume || downloading !== null}
            className="w-full flex items-center gap-4 p-4 bg-muted/60 hover:bg-muted border border-border rounded-xl transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 rounded-lg bg-critical/10 flex items-center justify-center flex-shrink-0">
              <span className="font-mono text-xs font-bold text-critical">PDF</span>
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold text-foreground">
                {downloading === 'pdf' ? 'Generating PDF...' : 'Download PDF'}
              </div>
              <div className="text-xs text-muted-foreground">ATS-safe formatting, print-ready</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted-foreground group-hover:text-foreground transition-colors">
              <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          <button
            onClick={() => handleDownload('docx')}
            disabled={!resume || downloading !== null}
            className="w-full flex items-center gap-4 p-4 bg-muted/60 hover:bg-muted border border-border rounded-xl transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
              <span className="font-mono text-xs font-bold text-accent">DOC</span>
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold text-foreground">
                {downloading === 'docx' ? 'Generating DOCX...' : 'Download DOCX'}
              </div>
              <div className="text-xs text-muted-foreground">Editable Word document</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted-foreground group-hover:text-foreground transition-colors">
              <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Footer */}
        <button
          onClick={() => { onClose(); onNav('editor') }}
          className="w-full py-2.5 border border-border text-foreground text-sm font-medium rounded-xl hover:bg-muted transition-colors"
        >
          Continue Editing
        </button>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Your resume is not stored after this session ends.
        </p>
      </div>
    </div>
  )
}
