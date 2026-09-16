import { useState, useRef, useCallback } from 'react'
import type { View } from '../App'

interface Props {
  onNav: (v: View) => void
}

export default function ResumeUpload({ onNav }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<{ name: string; size: string; type: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    const ext = f.name.split('.').pop()?.toUpperCase() ?? 'PDF'
    const kb = f.size / 1024
    const size = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`
    setFile({ name: f.name, size, type: ext })
    setUploading(true)
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(interval); setUploading(false); return 100 }
        return p + 12
      })
    }, 100)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = () => setIsDragging(false)

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        <div className="mb-8">
          <h1 className="font-serif text-4xl text-foreground mb-3">
            {"Let's analyze your resume"}
          </h1>
          <p className="text-muted-foreground">
            Upload your resume and get a full ATS compatibility analysis in seconds.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-accent bg-secondary/50'
              : file
              ? 'border-success/40 bg-success-bg/20'
              : 'border-border hover:border-primary/40 hover:bg-muted/50'
          }`}
          onClick={() => !file && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload resume"
          onKeyDown={(e) => e.key === 'Enter' && !file && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={onInputChange}
          />

          {!file ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto mb-4 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M14 18V8M10 12l4-4 4 4" stroke="#A855F7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6 22h16" stroke="#A855F7" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <p className="font-medium text-foreground mb-1">
                {isDragging ? 'Drop your resume here' : 'Drag & drop your resume here'}
              </p>
              <p className="text-sm text-muted-foreground mb-4">or</p>
              <button
                type="button"
                className="px-5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
              >
                Browse Files
              </button>
              <p className="mt-4 text-xs text-muted-foreground">Supports PDF, DOCX</p>
            </>
          ) : (
            <div className="text-left">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <span className="font-mono text-xs font-bold text-primary">{file.type}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground text-sm truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{file.size} · {file.type}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); setProgress(0) }}
                      className="p-1 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                      aria-label="Remove file"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>

                  {/* Progress */}
                  {progress < 100 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                        <span>Uploading...</span>
                        <span className="font-mono">{progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-100"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {progress === 100 && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-success font-medium">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Ready to analyze
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Privacy note */}
        <div className="mt-4 flex items-start gap-2.5 p-4 bg-muted/60 rounded-xl">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted-foreground flex-shrink-0 mt-0.5">
            <path d="M8 1l6 2.5V8c0 3.5-2.5 5.5-6 7C2.5 13.5 0 11.5 0 8V3.5L8 1z" stroke="currentColor" strokeWidth="1.2" fill="none" />
          </svg>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your resume is processed for analysis and is not required to create an account. We do not store or share your resume content.
          </p>
        </div>

        {/* Analyze button */}
        <button
          disabled={!file || uploading || progress < 100}
          onClick={() => onNav('processing')}
          className="mt-6 w-full py-3.5 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
        >
          {!file ? 'Upload a resume to continue' : uploading ? 'Uploading...' : 'Analyze My Resume'}
        </button>

        {/* Demo shortcut */}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          No resume?{' '}
          <button
            onClick={() => {
              setFile({ name: 'my_resume.pdf', size: '142 KB', type: 'PDF' })
              setUploading(false)
              setProgress(100)
            }}
            className="text-accent underline hover:no-underline"
          >
            Use a sample resume
          </button>
        </p>
      </div>
    </div>
  )
}
