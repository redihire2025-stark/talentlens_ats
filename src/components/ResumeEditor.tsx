import { useState } from 'react'
import type { View } from '../App'
import { ScoreRing, ProgressBar } from './shared'

interface Props {
  onNav: (v: View) => void
  onExport: () => void
}

type Section = 'contact' | 'summary' | 'skills' | 'experience' | 'education' | 'projects' | 'certifications'

const sections: Array<{ id: Section; label: string }> = [
  { id: 'contact', label: 'Contact' },
  { id: 'summary', label: 'Summary' },
  { id: 'skills', label: 'Skills' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'projects', label: 'Projects' },
  { id: 'certifications', label: 'Certifications' },
]

const initialContent: Record<Section, string> = {
  contact: 'Alex Chen\nalex.chen@email.com\nSan Francisco, CA\nlinkedin.com/in/alexchen\ngithub.com/alexchen',
  summary:
    'Senior Frontend Engineer with 6 years of experience building scalable React and TypeScript applications. Passionate about performance, accessibility, and clean component architecture.',
  skills:
    'React · TypeScript · JavaScript · HTML/CSS · REST APIs · GraphQL · AWS · Git · Webpack · Vite · Jest · Cypress',
  experience:
    'Senior Frontend Engineer — Acme Corp (2021–Present)\n• Built reusable React components used across multiple production applications\n• Led performance optimization initiative, reducing core load time by 45%\n• Collaborated with design team to establish component library used by 8 engineers\n\nFrontend Engineer — Startup Inc (2019–2021)\n• Developed new customer dashboard using React and TypeScript\n• Integrated REST APIs and implemented real-time data updates\n• Wrote unit and integration tests achieving 85% code coverage',
  education:
    'B.S. Computer Science — University of California, Berkeley (2019)\nGPA: 3.7 · Dean\'s List',
  projects:
    'Open Source Component Library (github.com/alexchen/ui-kit)\n• React component library with 1.2K GitHub stars\n• Full TypeScript support, Storybook documentation, 95% test coverage',
  certifications: 'AWS Certified Developer – Associate (2022)\nGoogle Analytics Certified (2021)',
}

const liveScores = {
  ats: { base: 87, improved: 91 },
  jd: { base: 84, improved: 89 },
}

export default function ResumeEditor({ onNav, onExport }: Props) {
  const [activeSection, setActiveSection] = useState<Section>('experience')
  const [content, setContent] = useState(initialContent)
  const [edited, setEdited] = useState(false)

  const handleChange = (val: string) => {
    setContent((prev) => ({ ...prev, [activeSection]: val }))
    if (!edited) setEdited(true)
  }

  const atsScore = edited ? liveScores.ats.improved : liveScores.ats.base
  const jdScore = edited ? liveScores.jd.improved : liveScores.jd.base

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Toolbar */}
      <div className="border-b border-border bg-card px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">Resume Editor</span>
          <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-md font-mono">resume_v2.pdf</span>
          {edited && (
            <span className="px-2 py-0.5 bg-warning-bg text-warning text-xs rounded-md font-medium">Unsaved changes</span>
          )}
        </div>
        <div className="flex gap-2">
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
          {sections.map((s) => (
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

          <div className="mt-4 px-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Versions</div>
            {['Original', 'Version 1', 'Version 2'].map((v, i) => (
              <div key={v} className={`px-2.5 py-2 rounded-lg mb-1 cursor-pointer text-xs transition-colors ${i === 1 ? 'bg-secondary text-secondary-foreground font-medium' : 'text-muted-foreground hover:bg-card'}`}>
                {v}
              </div>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground">{sections.find((s) => s.id === activeSection)?.label}</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => onNav('recommendations')}
                  className="text-xs text-accent hover:underline"
                >
                  View recommendations
                </button>
              </div>
            </div>

            <textarea
              key={activeSection}
              value={content[activeSection]}
              onChange={(e) => handleChange(e.target.value)}
              rows={12}
              className="w-full bg-card border border-border rounded-xl px-5 py-4 text-sm text-foreground leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring resize-none font-sans"
              spellCheck
            />

            <p className="mt-2 text-xs text-muted-foreground">
              Edit directly. Changes are reflected in the live score panel.
            </p>
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
              {edited && (
                <div className="font-mono text-xs text-success mt-1">
                  {liveScores.ats.base} → {liveScores.ats.improved}
                </div>
              )}
            </div>

            {/* JD match */}
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <ScoreRing score={jdScore} size={80} strokeWidth={7} />
              <div className="text-xs font-medium text-foreground mt-2.5">JD Match</div>
              {edited && (
                <div className="font-mono text-xs text-success mt-1">
                  {liveScores.jd.base} → {liveScores.jd.improved}
                </div>
              )}
            </div>

            {/* Mini breakdown */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="text-xs font-medium text-foreground mb-3">Score factors</div>
              <div className="space-y-2.5">
                {[
                  { label: 'Keywords', v: edited ? 87 : 82 },
                  { label: 'Impact', v: edited ? 85 : 78 },
                  { label: 'Skills', v: edited ? 88 : 85 },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-mono text-foreground">{item.v}%</span>
                    </div>
                    <ProgressBar value={item.v} height={4} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
