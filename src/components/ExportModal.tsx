import type { View } from '../App'

interface Props {
  onClose: () => void
  onNav: (v: View) => void
}

export default function ExportModal({ onClose, onNav }: Props) {
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
              Download your optimized resume in your preferred format.
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
        <div className="bg-success-bg border border-success/20 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7l4 4 6-7" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Optimized resume</p>
            <p className="text-xs text-muted-foreground font-mono">ATS Score: 82 → 89 · JD Match: 84 → 89</p>
          </div>
        </div>

        {/* Download options */}
        <div className="space-y-3 mb-6">
          <button className="w-full flex items-center gap-4 p-4 bg-muted/60 hover:bg-muted border border-border rounded-xl transition-colors group">
            <div className="w-10 h-10 rounded-lg bg-critical/10 flex items-center justify-center flex-shrink-0">
              <span className="font-mono text-xs font-bold text-critical">PDF</span>
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold text-foreground">Download PDF</div>
              <div className="text-xs text-muted-foreground">ATS-safe formatting, print-ready</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted-foreground group-hover:text-foreground transition-colors">
              <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          <button className="w-full flex items-center gap-4 p-4 bg-muted/60 hover:bg-muted border border-border rounded-xl transition-colors group">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
              <span className="font-mono text-xs font-bold text-accent">DOC</span>
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold text-foreground">Download DOCX</div>
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
