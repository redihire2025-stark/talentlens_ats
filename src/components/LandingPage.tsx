import type { View } from '../App'
import { ScoreRing, ProgressBar } from './shared'

interface Props {
  onNav: (v: View) => void
}

const trustItems = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 9l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: 'ATS Compatibility',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: 'Skill Matching',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 15l3-3 2 2 4-5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="2" y="3" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    label: 'Resume Quality',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M6 4h8M6 8h8M6 12h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    label: 'JD Analysis',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    label: 'Actionable Recommendations',
  },
]

const features = [
  {
    title: 'ATS Compatibility Analysis',
    description:
      'Understand how your resume performs against common ATS parsing requirements with a transparent, section-by-section breakdown.',
    detail: '7 scoring dimensions',
    color: '#3730A3',
  },
  {
    title: 'Job Description Matching',
    description:
      'Paste or upload a job description and see exactly how your skills, experience, and keywords align with what the role requires.',
    detail: '6 match dimensions',
    color: '#6366F1',
  },
  {
    title: 'Actionable Recommendations',
    description:
      'Get specific, evidence-based suggestions for improving your resume — with the ability to accept, reject, or edit each one.',
    detail: 'Accept · Reject · Edit',
    color: '#8B5CF6',
  },
]

const steps = [
  { num: '01', title: 'Upload your resume', desc: 'PDF or DOCX, no account required.' },
  { num: '02', title: 'Get your ATS score', desc: 'A transparent breakdown across 7 dimensions in seconds.' },
  { num: '03', title: 'Match against a job', desc: 'Paste any job description to see how your resume aligns.' },
  { num: '04', title: 'Improve with confidence', desc: 'Evidence-based suggestions you control entirely.' },
]

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-[420px]">
      {/* Glow */}
      <div className="absolute inset-0 rounded-3xl blur-3xl opacity-20 bg-primary pointer-events-none" />

      {/* Main card */}
      <div className="relative bg-card rounded-2xl border border-border shadow-2xl p-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">ATS Analysis</div>
            <div className="text-sm font-semibold text-foreground mt-0.5">resume_v2.pdf</div>
          </div>
          <div className="px-2.5 py-1 bg-success-bg text-success text-xs font-medium rounded-full flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            Analyzed
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center gap-5 mb-5">
          <ScoreRing score={87} size={96} strokeWidth={8} />
          <div className="flex-1">
            <div className="text-sm font-semibold text-foreground">ATS Compatibility</div>
            <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Highly compatible with common ATS-style parsing requirements.
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-2.5">
          {[
            { label: 'Parsing', value: 96 },
            { label: 'Sections', value: 100 },
            { label: 'Keywords', value: 82 },
            { label: 'Experience', value: 91 },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="w-20 text-xs text-muted-foreground">{item.label}</div>
              <div className="flex-1">
                <ProgressBar value={item.value} />
              </div>
              <div className="w-8 text-right font-mono text-xs font-semibold text-foreground">
                {item.value}%
              </div>
            </div>
          ))}
        </div>

        {/* Skill tags */}
        <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-1.5">
          {['React', 'TypeScript', 'REST APIs', 'AWS'].map((s) => (
            <span key={s} className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-md font-medium">
              ✓ {s}
            </span>
          ))}
          <span className="px-2 py-0.5 bg-critical-bg text-critical text-xs rounded-md font-medium">
            × Docker
          </span>
        </div>
      </div>

      {/* Floating chip */}
      <div className="absolute -bottom-3 -right-3 bg-card border border-border rounded-xl shadow-lg px-3 py-2 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-success-bg flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <div className="text-xs font-semibold text-foreground">Score improved</div>
          <div className="font-mono text-[10px] text-success">82 → 89</div>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage({ onNav }: Props) {
  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full text-xs font-medium text-secondary-foreground mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              AI-powered career intelligence
            </div>

            <h1 className="font-serif text-5xl lg:text-6xl text-foreground leading-[1.08] tracking-tight mb-6">
              Know how your resume performs{' '}
              <em className="not-italic text-accent">before</em> you apply.
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
              Analyze your resume, understand ATS compatibility, match it against a job description, and improve it with actionable recommendations.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => onNav('upload')}
                className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors text-sm"
              >
                Check My Resume
              </button>
              <button
                onClick={() => onNav('jd-match')}
                className="px-6 py-3 bg-secondary text-secondary-foreground font-medium rounded-xl hover:bg-secondary/80 transition-colors text-sm border border-border"
              >
                Match With a Job
              </button>
            </div>

            <p className="mt-5 text-xs text-muted-foreground">
              No account required. Your resume is processed for analysis only.
            </p>
          </div>

          {/* Right: mockup */}
          <div className="flex justify-center lg:justify-end">
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-border bg-muted/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {trustItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="text-accent">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="text-center mb-14">
          <h2 className="font-serif text-4xl text-foreground mb-4">
            Your resume intelligence workspace
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            TalentLens surfaces evidence-based insights from your resume — not guesses, not generic advice.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: f.color + '15' }}
              >
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: f.color }} />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{f.description}</p>
              <span
                className="font-mono text-xs px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: f.color + '12', color: f.color }}
              >
                {f.detail}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-foreground text-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="mb-14">
            <h2 className="font-serif text-4xl mb-3">How it works</h2>
            <p className="text-foreground/60 max-w-lg">
              Four steps from upload to a stronger resume — no account, no guesswork.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={s.num} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-white/10 z-0" style={{ width: 'calc(100% - 2.5rem)', left: '2.5rem' }} />
                )}
                <div className="font-mono text-3xl font-bold text-white/20 mb-3">{s.num}</div>
                <h3 className="font-semibold text-card mb-2">{s.title}</h3>
                <p className="text-sm text-foreground/50 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Final CTA */}
      <section className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="font-serif text-4xl text-foreground mb-4">
            Ready to see how your resume scores?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Upload your resume and get a detailed ATS analysis in seconds — no account required.
          </p>
          <button
            onClick={() => onNav('upload')}
            className="px-8 py-3.5 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors"
          >
            Check My Resume
          </button>
        </div>
      </section>
    </div>
  )
}
