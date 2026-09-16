import { useState } from 'react'
import type { View } from '../App'
import { ProgressBar } from './shared'

interface Props {
  onNav: (v: View) => void
}

type Tab = 'candidates' | 'shortlist' | 'jobs'
type SkillStatus = 'matched' | 'partial' | 'missing'

interface Candidate {
  id: number
  initials: string
  name: string
  title: string
  match: number
  summary: string
  experience: string
  location: string
  education: string
  skills: Array<{ name: string; status: SkillStatus }>
  shortlisted: boolean
}

const job = {
  title: 'Senior Frontend Engineer',
  department: 'Engineering',
  type: 'Full-time · Remote',
  postedDays: 5,
  applicants: 12,
  requiredSkills: ['React', 'TypeScript', 'AWS'],
  preferredSkills: ['Docker', 'GraphQL', 'CI/CD'],
  experience: '5+ years',
  description:
    'We are looking for a Senior Frontend Engineer to lead development on our core product. You will architect scalable React applications, collaborate closely with design, and mentor junior engineers.',
}

const initialCandidates: Candidate[] = [
  {
    id: 1,
    initials: 'AC',
    name: 'Alex Chen',
    title: 'Senior Frontend Engineer',
    match: 91,
    summary:
      'Six years building production React applications at scale. Strong AWS and TypeScript background. Led a team of four frontend engineers.',
    experience: '6 years',
    location: 'San Francisco, CA',
    education: 'B.S. Computer Science, UC Berkeley',
    skills: [
      { name: 'React', status: 'matched' },
      { name: 'TypeScript', status: 'matched' },
      { name: 'AWS', status: 'matched' },
      { name: 'Docker', status: 'partial' },
      { name: 'GraphQL', status: 'partial' },
      { name: 'CI/CD', status: 'missing' },
    ],
    shortlisted: false,
  },
  {
    id: 2,
    initials: 'MR',
    name: 'Maya Rodriguez',
    title: 'Full Stack Engineer',
    match: 85,
    summary:
      'Five years across frontend and backend. Deep React expertise, solid AWS certifications, and active open-source contributions.',
    experience: '5 years',
    location: 'Remote',
    education: 'M.S. Software Engineering, Georgia Tech',
    skills: [
      { name: 'React', status: 'matched' },
      { name: 'TypeScript', status: 'matched' },
      { name: 'AWS', status: 'matched' },
      { name: 'Docker', status: 'missing' },
      { name: 'GraphQL', status: 'partial' },
      { name: 'CI/CD', status: 'matched' },
    ],
    shortlisted: false,
  },
  {
    id: 3,
    initials: 'JL',
    name: 'Jordan Lee',
    title: 'Frontend Developer',
    match: 72,
    summary:
      'Four years of React development. Strong in UI/UX collaboration. Limited cloud infrastructure experience but fast learner.',
    experience: '4 years',
    location: 'New York, NY',
    education: 'B.S. Information Systems, NYU',
    skills: [
      { name: 'React', status: 'matched' },
      { name: 'TypeScript', status: 'partial' },
      { name: 'AWS', status: 'missing' },
      { name: 'Docker', status: 'matched' },
      { name: 'GraphQL', status: 'missing' },
      { name: 'CI/CD', status: 'partial' },
    ],
    shortlisted: false,
  },
]

const skillConfig: Record<SkillStatus, { bg: string; text: string; border: string; icon: React.ReactNode; label: string }> = {
  matched: {
    bg: 'bg-success-bg',
    text: 'text-success',
    border: 'border-success/20',
    label: 'Evidenced in resume',
    icon: (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M1.5 5l2.5 2.5 4.5-5" stroke="#16A34A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  partial: {
    bg: 'bg-warning-bg',
    text: 'text-warning',
    border: 'border-warning/20',
    label: 'Partially evidenced',
    icon: (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M5 2v3.5M5 7.5v.5" stroke="#D97706" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  missing: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
    label: 'Not evidenced',
    icon: (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M2 2l6 6M8 2L2 8" stroke="#6B7080" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
}

const howItWorks = [
  {
    step: '01',
    title: 'Post a job',
    desc: 'Add a job description with required and preferred skills. TalentLens uses it as the benchmark for every candidate.',
  },
  {
    step: '02',
    title: 'Candidates apply',
    desc: 'Each candidate submits their resume. TalentLens parses it and scores alignment across skills, experience, and responsibilities.',
  },
  {
    step: '03',
    title: 'Review match insights',
    desc: 'See a clear breakdown of how each resume maps to your job — not a ranking, just evidence. You decide who to interview.',
  },
  {
    step: '04',
    title: 'Build your shortlist',
    desc: 'Add candidates to your shortlist, leave notes, and share with your hiring team for the final decision.',
  },
]

const plannedFeatures = [
  { icon: '📋', title: 'Multi-job Management', desc: 'Manage multiple open roles and track candidates across jobs.' },
  { icon: '👥', title: 'Team Collaboration', desc: 'Share candidate views and shortlists with your hiring team.' },
  { icon: '📊', title: 'Pipeline Analytics', desc: 'Track applicants through stages from applied to offer.' },
  { icon: '🔔', title: 'New Match Alerts', desc: 'Get notified when a strong match applies for your open role.' },
]

export default function RecruiterPreview({ onNav }: Props) {
  const [tab, setTab] = useState<Tab>('candidates')
  const [candidates, setCandidates] = useState(initialCandidates)
  const [expanded, setExpanded] = useState<number | null>(1)

  const toggleShortlist = (id: number) =>
    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, shortlisted: !c.shortlisted } : c)))

  const shortlisted = candidates.filter((c) => c.shortlisted)

  return (
    <div className="bg-background min-h-screen">
      {/* Page hero */}
      <div className="bg-foreground text-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-xs font-medium text-white/80 mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Coming Soon — Early Preview
              </div>
              <h1 className="font-serif text-4xl lg:text-5xl mb-4 leading-tight">
                TalentLens for Recruiters
              </h1>
              <p className="text-white/60 leading-relaxed mb-6 text-lg">
                Match candidate resumes against your job description. See evidence-based alignment across skills, experience, and responsibilities — so your team can make informed decisions faster.
              </p>
              <p className="text-white/40 text-sm">
                TalentLens surfaces match insights. The recruiter makes every hiring decision.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 text-center">
              {[
                { value: '3', label: 'Candidates reviewed' },
                { value: '91%', label: 'Top match score' },
                { value: '6', label: 'Skills evaluated' },
                { value: '1', label: 'Open role' },
              ].map((s) => (
                <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl px-5 py-4">
                  <div className="font-mono text-2xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-white/50 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* How it works */}
        <section className="mb-12">
          <h2 className="font-serif text-2xl text-foreground mb-6">How the recruiter workflow works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {howItWorks.map((step) => (
              <div key={step.step} className="bg-card border border-border rounded-xl p-5">
                <div className="font-mono text-2xl font-bold text-border mb-3">{step.step}</div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Active job card */}
        <section className="mb-6">
          <h2 className="font-serif text-2xl text-foreground mb-4">Active Job</h2>
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <rect x="2" y="6" width="18" height="14" rx="2" stroke="#3730A3" strokeWidth="1.5" />
                    <path d="M7 6V5a4 4 0 018 0v1" stroke="#3730A3" strokeWidth="1.5" />
                    <path d="M6 13h10M6 16h6" stroke="#3730A3" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-lg text-foreground">{job.title}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{job.department} · {job.type}</div>
                  <div className="text-xs text-muted-foreground mt-1">Posted {job.postedDays} days ago · {job.applicants} applicants · Needs {job.experience}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">Required skills</div>
                  <div className="flex gap-1.5">
                    {job.requiredSkills.map((s) => (
                      <span key={s} className="px-2.5 py-1 bg-primary/8 text-primary text-xs font-medium rounded-lg border border-primary/15">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">Preferred skills</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {job.preferredSkills.map((s) => (
                      <span key={s} className="px-2.5 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-lg border border-border">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">{job.description}</p>
            </div>
          </div>
        </section>

        {/* Skill legend */}
        <div className="mb-6 flex flex-wrap items-center gap-4 p-4 bg-muted/60 rounded-xl border border-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Skill legend:</span>
          {(Object.entries(skillConfig) as [SkillStatus, typeof skillConfig[SkillStatus]][]).map(([status, cfg]) => (
            <div key={status} className="flex items-center gap-1.5">
              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md ${cfg.bg} border ${cfg.border}`}>
                {cfg.icon}
              </span>
              <span className="text-xs text-foreground font-medium">{cfg.label}</span>
            </div>
          ))}
          <span className="text-xs text-muted-foreground ml-auto">Skills are parsed from the candidate resume — not self-reported.</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-xl mb-6 w-fit">
          {([
            { id: 'candidates' as Tab, label: 'All Candidates', count: candidates.length },
            { id: 'shortlist' as Tab, label: 'Shortlist', count: shortlisted.length },
            { id: 'jobs' as Tab, label: 'Jobs', count: 1 },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                tab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
              <span className={`px-1.5 py-0.5 rounded-md font-mono text-xs ${tab === t.id ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Candidates tab */}
        {tab === 'candidates' && (
          <div className="space-y-4">
            {candidates.map((c) => {
              const isExpanded = expanded === c.id
              const matchColor = c.match >= 85 ? '#16A34A' : c.match >= 70 ? '#D97706' : '#DC2626'
              const matchLabel = c.match >= 85 ? 'Strong alignment' : c.match >= 70 ? 'Moderate alignment' : 'Low alignment'

              return (
                <div key={c.id} className={`bg-card border rounded-2xl overflow-hidden transition-all ${c.shortlisted ? 'border-success/30' : 'border-border'}`}>
                  {/* Candidate header */}
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center font-semibold text-primary text-sm flex-shrink-0">
                        {c.initials}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-foreground">{c.name}</span>
                              {c.shortlisted && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success-bg text-success text-xs font-medium rounded-full">
                                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                    <path d="M1 4l2 2 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                  Shortlisted
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-0.5">{c.title} · {c.experience} exp · {c.location}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{c.education}</div>
                          </div>

                          {/* Match score */}
                          <div className="flex-shrink-0 text-right">
                            <div className="text-xs text-muted-foreground mb-1">Match Insights</div>
                            <div className="font-mono text-3xl font-bold leading-none" style={{ color: matchColor }}>
                              {c.match}%
                            </div>
                            <div className="text-xs mt-1 font-medium" style={{ color: matchColor }}>{matchLabel}</div>
                          </div>
                        </div>

                        {/* Match bar */}
                        <div className="mt-3 mb-3">
                          <ProgressBar value={c.match} height={6} />
                        </div>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {c.skills.map((s) => {
                            const cfg = skillConfig[s.status]
                            return (
                              <span
                                key={s.name}
                                title={cfg.label}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                              >
                                {cfg.icon}
                                {s.name}
                              </span>
                            )
                          })}
                        </div>

                        {/* Actions row */}
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <button
                            onClick={() => setExpanded(isExpanded ? null : c.id)}
                            className="text-xs text-accent hover:underline font-medium flex items-center gap-1"
                          >
                            {isExpanded ? 'Hide profile summary' : 'View profile summary'}
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>

                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleShortlist(c.id)}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                                c.shortlisted
                                  ? 'bg-success-bg border-success/20 text-success hover:bg-critical-bg hover:text-critical hover:border-critical/20'
                                  : 'border-border text-muted-foreground hover:bg-muted'
                              }`}
                            >
                              {c.shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded summary */}
                  {isExpanded && (
                    <div className="border-t border-border bg-muted/30 px-5 py-4">
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Candidate Summary</div>
                          <p className="text-sm text-foreground leading-relaxed">{c.summary}</p>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Skills Alignment Detail</div>
                          <div className="space-y-1.5">
                            {c.skills.map((s) => {
                              const cfg = skillConfig[s.status]
                              return (
                                <div key={s.name} className="flex items-center gap-2">
                                  <span className={`inline-flex items-center justify-center w-4 h-4 rounded ${cfg.bg}`}>{cfg.icon}</span>
                                  <span className="text-sm font-medium text-foreground">{s.name}</span>
                                  <span className="text-xs text-muted-foreground">— {cfg.label}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          <strong>Note:</strong> TalentLens provides match insights based on resume content only. All hiring decisions — including who to interview, evaluate, and select — are made entirely by the recruiter and hiring team.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Shortlist tab */}
        {tab === 'shortlist' && (
          <div>
            {shortlisted.length === 0 ? (
              <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M12 5v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="font-semibold text-foreground mb-1">No candidates shortlisted yet</p>
                <p className="text-sm text-muted-foreground mb-4">Go to the Candidates tab and add candidates to your shortlist.</p>
                <button
                  onClick={() => setTab('candidates')}
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors"
                >
                  View Candidates
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {shortlisted.map((c) => (
                  <div key={c.id} className="bg-card border border-success/25 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-semibold text-primary text-sm flex-shrink-0">
                      {c.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground">{c.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{c.title} · {c.experience} exp</div>
                    </div>
                    <div className="font-mono text-lg font-bold" style={{ color: c.match >= 85 ? '#16A34A' : '#D97706' }}>{c.match}%</div>
                    <button
                      onClick={() => toggleShortlist(c.id)}
                      className="px-3 py-1.5 text-xs border border-border text-muted-foreground rounded-lg hover:bg-muted transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Jobs tab */}
        {tab === 'jobs' && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="font-semibold text-foreground text-lg">{job.title}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{job.department} · {job.type}</div>
              </div>
              <span className="px-2.5 py-1 bg-success-bg text-success text-xs font-medium rounded-full">Active</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">{job.description}</p>
            <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-border">
              <div className="text-center p-3 bg-muted/50 rounded-xl">
                <div className="font-mono text-2xl font-bold text-foreground">{candidates.length}</div>
                <div className="text-xs text-muted-foreground mt-1">Candidates analyzed</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-xl">
                <div className="font-mono text-2xl font-bold text-foreground">{shortlisted.length}</div>
                <div className="text-xs text-muted-foreground mt-1">Shortlisted</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-xl">
                <div className="font-mono text-2xl font-bold text-foreground">{job.applicants}</div>
                <div className="text-xs text-muted-foreground mt-1">Total applicants</div>
              </div>
            </div>
          </div>
        )}

        {/* Planned features */}
        <section className="mt-14 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="font-serif text-2xl text-foreground">What we are building next</h2>
            <span className="px-2.5 py-1 bg-secondary text-secondary-foreground text-xs font-medium rounded-full">Roadmap</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plannedFeatures.map((f) => (
              <div key={f.title} className="bg-card border border-border rounded-xl p-5">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="mt-8 bg-foreground text-card rounded-2xl p-8 flex flex-wrap items-center justify-between gap-6">
          <div>
            <h3 className="font-serif text-2xl mb-2">Are you a job seeker?</h3>
            <p className="text-white/60 text-sm">Check how your resume performs against ATS requirements and job descriptions — no account needed.</p>
          </div>
          <button
            onClick={() => onNav('upload')}
            className="px-6 py-3 bg-accent text-white font-medium rounded-xl hover:bg-accent/90 transition-colors flex-shrink-0"
          >
            Check My Resume
          </button>
        </div>
      </div>
    </div>
  )
}
