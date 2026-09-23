import type { View } from '../App'
import { ProgressBar } from './shared'

interface Props {
  onNav: (v: View) => void
}

function MiniDashboard() {
  return (
    <div className="relative w-full max-w-[440px] mx-auto">
      {/* Glow backdrop */}
      <div className="absolute -inset-6 rounded-3xl opacity-30" style={{ background: 'radial-gradient(ellipse at center, #7C3AED 0%, transparent 70%)' }} />

      {/* Main card */}
      <div className="relative bg-card rounded-2xl shadow-2xl overflow-hidden border border-border">
        {/* Card header bar */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-[#16161F]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#DC2626]/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#D97706]/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]/40" />
          </div>
          <span className="font-mono text-xs text-muted-foreground">resume_analysis.pdf</span>
          <span className="px-2 py-0.5 bg-[#1E1B2E] text-[#C4B5FD] text-[10px] font-semibold rounded-full">✓ Analyzed</span>
        </div>

        <div className="p-6">
          {/* Score ring + label */}
          <div className="flex items-center gap-5 mb-5">
            <div className="relative flex-shrink-0">
              <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="44" cy="44" r="36" fill="none" stroke="#1F1F2E" strokeWidth="8" />
                <circle cx="44" cy="44" r="36" fill="none" stroke="#7C3AED" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * 0.13}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-xl font-bold text-foreground">87</span>
                <span className="font-mono text-[9px] text-muted-foreground">/100</span>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Resume Health</div>
              <div className="font-semibold text-foreground text-sm mb-1">Highly Compatible</div>
              <div className="text-xs text-muted-foreground leading-relaxed">Strong structure, clear formatting, good keyword coverage.</div>
            </div>
          </div>

          {/* Progress bars */}
          <div className="space-y-2.5">
            {[
              { label: 'Parsing', value: 96 },
              { label: 'Keywords', value: 82 },
              { label: 'Experience', value: 91 },
              { label: 'Formatting', value: 94 },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="w-20 text-xs text-muted-foreground flex-shrink-0">{item.label}</span>
                <div className="flex-1">
                  <ProgressBar value={item.value} />
                </div>
                <span className="font-mono text-xs font-semibold text-foreground w-8 text-right">{item.value}%</span>
              </div>
            ))}
          </div>

          {/* Skill chips */}
          <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-1.5">
            {['✓ React', '✓ TypeScript', '✓ AWS', '✓ REST APIs'].map((s) => (
              <span key={s} className="px-2 py-0.5 bg-[#1E1B2E] text-[#C4B5FD] text-xs font-medium rounded-md">{s}</span>
            ))}
            <span className="px-2 py-0.5 bg-[#4C0519] text-[#F43F5E] text-xs font-medium rounded-md">× Docker</span>
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -bottom-4 -left-4 bg-card rounded-xl shadow-lg border border-border px-4 py-2.5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#1E1B2E] flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7l3.5 3.5 6.5-7" stroke="#A855F7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <div className="text-xs font-semibold text-foreground">Score improved</div>
          <div className="font-mono text-[11px] text-[#A855F7] font-medium">82 → 89 after edits</div>
        </div>
      </div>

      {/* Floating score chip */}
      <div className="absolute -top-4 -right-4 bg-[#7C3AED] text-white rounded-xl shadow-lg px-4 py-2.5">
        <div className="font-mono text-xs font-medium opacity-80 mb-0.5">JD Match</div>
        <div className="font-mono text-lg font-bold">84%</div>
      </div>
    </div>
  )
}

const features = [
  {
    num: '01',
    title: 'ATS Score',
    desc: 'Instant compatibility report across 7 dimensions — parsing, keywords, sections, formatting, and more.',
    color: '#A855F7',
    lightBg: '#1E1B2E',
  },
  {
    num: '02',
    title: 'JD Matching',
    desc: 'Paste any job description to see exactly how your skills and experience align with the role requirements.',
    color: '#A855F7',
    lightBg: '#1E1B2E',
  },
  {
    num: '03',
    title: 'Smart Suggestions',
    desc: 'Evidence-based bullet rewrites and keyword improvements you can accept, reject, or customize.',
    color: '#A855F7',
    lightBg: '#1E1B2E',
  },
]

const stats = [
  { value: '87/100', label: 'Average ATS score' },
  { value: '7', label: 'Analysis dimensions' },
  { value: '< 10s', label: 'Time to results' },
  { value: '0', label: 'Accounts required' },
]

export default function LandingPage({ onNav }: Props) {
  return (
    <div className="bg-background">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0A0A0F 0%, #1E1B2E 60%, #13131A 100%)' }}>
        {/* Subtle grid texture */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 lg:pt-24 lg:pb-32">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">

            {/* Left copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 border border-white/20 rounded-full text-xs font-medium text-white/90 mb-6 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7] animate-pulse" />
                AI-powered resume intelligence
              </div>

              <h1 className="font-serif text-5xl lg:text-6xl text-white leading-[1.05] tracking-tight mb-6">
                Know how your resume performs{' '}
                <span className="italic text-[#C4B5FD]">before</span>{' '}
                you apply.
              </h1>

              <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-md">
                Upload your resume, get a Resume Health / ATS Readiness score, match it against any job description, and improve it with evidence-based suggestions.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <button
                  onClick={() => onNav('upload')}
                  className="px-7 py-3.5 bg-white text-[#7C3AED] font-semibold rounded-xl hover:bg-white/90 transition-all shadow-lg shadow-black/20 text-sm"
                >
                  Check My Resume
                </button>
                <button
                  onClick={() => onNav('jd-match')}
                  className="px-7 py-3.5 bg-white/10 border border-white/25 text-white font-medium rounded-xl hover:bg-white/20 transition-all text-sm backdrop-blur-sm"
                >
                  Match With a Job
                </button>
              </div>

              <p className="text-white/40 text-xs">
                No account required · Resume processed for analysis only · Your data stays private
              </p>
            </div>

            {/* Right: dashboard */}
            <div className="flex justify-center lg:justify-end py-8">
              <MiniDashboard />
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none" style={{ width: '100%', height: 60 }}>
            <path d="M0 60V30C360 0 720 60 1080 30L1440 0V60H0Z" fill="#0A0A0F" />
          </svg>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card rounded-2xl shadow-lg border border-border -mt-6 relative z-10 grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border">
          {stats.map((s) => (
            <div key={s.label} className="px-6 py-5 text-center">
              <div className="font-mono text-2xl font-bold text-[#A855F7] mb-1">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="text-center mb-14">
          <div className="inline-block px-3 py-1 bg-[#1E1B2E] text-[#A855F7] text-xs font-semibold rounded-full mb-4 uppercase tracking-wider">
            What TalentLens does
          </div>
          <h2 className="font-serif text-4xl lg:text-5xl text-foreground mb-4 leading-tight">
            Your resume intelligence<br />workspace
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            Not a template generator. Not a formatter. A transparent, evidence-based analysis of how your resume actually performs.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="group bg-card rounded-2xl border border-border p-7 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              onClick={() => onNav('upload')}
            >
              <div className="flex items-start justify-between mb-5">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: f.lightBg }}
                >
                  <span className="font-mono text-xs font-bold" style={{ color: f.color }}>{f.num}</span>
                </div>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-border group-hover:text-[#A855F7] transition-colors mt-1">
                  <path d="M3 9h12M9 3l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="font-semibold text-xl text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              <div className="mt-5 pt-5 border-t border-border">
                <span className="text-sm font-medium" style={{ color: f.color }}>Get started →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-[#13131A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="inline-block px-3 py-1 bg-white/10 text-white/70 text-xs font-semibold rounded-full mb-5 uppercase tracking-wider">
                The process
              </div>
              <h2 className="font-serif text-4xl lg:text-5xl text-white leading-tight mb-5">
                From upload to a stronger resume in minutes
              </h2>
              <p className="text-white/50 leading-relaxed">
                No account, no waiting, no vague scores. Every insight is explained so you know exactly what to do next.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { num: '01', title: 'Upload your resume', desc: 'PDF or DOCX. Processed instantly, not stored.' },
                { num: '02', title: 'Get your ATS breakdown', desc: '7-dimension score with plain-language explanations for every result.' },
                { num: '03', title: 'Match against a job', desc: 'Paste any job description to see skills alignment, gaps, and match score.' },
                { num: '04', title: 'Improve with confidence', desc: 'Accept, reject, or edit every suggestion. You stay in control.' },
              ].map((step, i) => (
                <div key={step.num} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-[#7C3AED]/20 flex items-center justify-center flex-shrink-0">
                    <span className="font-mono text-xs font-bold text-[#A855F7]">{step.num}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm mb-0.5">{step.title}</div>
                    <div className="text-xs text-white/40 leading-relaxed">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust section ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="text-center mb-12">
          <h2 className="font-serif text-4xl text-foreground mb-3">Built on transparency</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Every score comes with a breakdown. Every suggestion comes with a reason. No black boxes.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: '🔍', title: 'Evidence-based', desc: 'Scores reflect actual resume content — not guesses. Every dimension is shown and explained.' },
            { icon: '🎛️', title: 'You stay in control', desc: 'Accept, reject, or edit every suggestion. TalentLens never rewrites your resume without permission.' },
            { icon: '🔒', title: 'Private by default', desc: 'Your resume is analyzed in-session and not stored. No account needed, ever.' },
            { icon: '⚡', title: 'Instant results', desc: 'Analysis takes seconds, not minutes. No waitlists, no queues.' },
            { icon: '📊', title: 'Transparent scoring', desc: 'The ATS score always shows a full breakdown — never a mysterious single number.' },
            { icon: '✏️', title: 'Honest suggestions', desc: 'We never suggest adding skills you don\'t have. Every recommendation is grounded in what\'s already in your resume.' },
          ].map((item) => (
            <div key={item.title} className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow">
              <div className="text-2xl mb-4">{item.icon}</div>
              <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div
          className="max-w-5xl mx-auto rounded-3xl p-12 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)' }}
        >
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: 'radial-gradient(circle at 30% 50%, white 1px, transparent 1px), radial-gradient(circle at 70% 50%, white 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }} />
          <div className="relative">
            <h2 className="font-serif text-4xl lg:text-5xl text-white mb-4 leading-tight">
              Ready to see how your<br />resume actually scores?
            </h2>
            <p className="text-white/70 mb-8 max-w-md mx-auto">
              Upload your resume and get a full ATS analysis in under 10 seconds. No account required.
            </p>
            <button
              onClick={() => onNav('upload')}
              className="px-8 py-4 bg-white text-[#7C3AED] font-semibold rounded-xl hover:bg-white/90 transition-all shadow-xl shadow-black/20 text-sm"
            >
              Check My Resume — Free
            </button>
            <p className="mt-4 text-white/40 text-xs">No signup · No credit card · Just results</p>
          </div>
        </div>
      </section>
    </div>
  )
}
