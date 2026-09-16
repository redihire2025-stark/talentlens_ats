import type { View } from '../App'
import { ProgressBar } from './shared'

interface Props {
  onNav: (v: View) => void
}

const candidates = [
  {
    id: 1,
    initials: 'AC',
    name: 'Candidate A',
    title: 'Senior Frontend Engineer',
    match: 91,
    skills: [
      { name: 'React', status: 'matched' as const },
      { name: 'TypeScript', status: 'matched' as const },
      { name: 'AWS', status: 'matched' as const },
      { name: 'Docker', status: 'partial' as const },
    ],
    experience: '6 years',
    location: 'San Francisco, CA',
  },
  {
    id: 2,
    initials: 'JL',
    name: 'Candidate B',
    title: 'Frontend Developer',
    match: 78,
    skills: [
      { name: 'React', status: 'matched' as const },
      { name: 'TypeScript', status: 'partial' as const },
      { name: 'AWS', status: 'missing' as const },
      { name: 'Docker', status: 'matched' as const },
    ],
    experience: '4 years',
    location: 'New York, NY',
  },
  {
    id: 3,
    initials: 'MR',
    name: 'Candidate C',
    title: 'Full Stack Engineer',
    match: 85,
    skills: [
      { name: 'React', status: 'matched' as const },
      { name: 'TypeScript', status: 'matched' as const },
      { name: 'AWS', status: 'matched' as const },
      { name: 'Docker', status: 'missing' as const },
    ],
    experience: '5 years',
    location: 'Remote',
  },
]

const skillColor = {
  matched: { bg: 'bg-success-bg', text: 'text-success', icon: '✓' },
  partial: { bg: 'bg-warning-bg', text: 'text-warning', icon: '△' },
  missing: { bg: 'bg-critical-bg', text: 'text-critical', icon: '×' },
}

export default function RecruiterPreview({ onNav }: Props) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Banner */}
      <div className="bg-secondary border border-primary/20 rounded-2xl p-5 mb-10 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="#3730A3" strokeWidth="1.5" />
            <path d="M10 7v3l2 2" stroke="#3730A3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-foreground text-sm">Recruiter Features — Coming Soon</p>
            <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">Preview</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This is an early preview of TalentLens for recruiting teams. The recruiter remains the decision-maker — TalentLens provides match insights, not hiring recommendations.
          </p>
        </div>
      </div>

      <div className="mb-8">
        <h1 className="font-serif text-3xl text-foreground mb-2">Recruiter Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Match Insights · Candidate Profiles · Skills Alignment
        </p>
      </div>

      {/* Job */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="5" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" />
              <path d="M6 5V4a3 3 0 016 0v1" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-foreground">Senior Frontend Engineer</div>
            <div className="text-xs text-muted-foreground mt-0.5">Engineering · Remote · Full-time</div>
          </div>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="font-mono font-semibold text-foreground">3</span> candidates
            <span className="font-mono font-semibold text-foreground">12</span> applicants
          </div>
        </div>
      </div>

      {/* Nav tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl mb-6 w-fit">
        {['Candidates', 'Shortlists', 'Jobs'].map((tab, i) => (
          <button
            key={tab}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              i === 0 ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Candidates */}
      <div className="space-y-4">
        {candidates.map((c) => (
          <div key={c.id} className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center font-semibold text-sm text-primary flex-shrink-0">
                {c.initials}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div>
                    <div className="font-semibold text-foreground">{c.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{c.title} · {c.experience} exp · {c.location}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-muted-foreground mb-1">Match Insights</div>
                    <div className="font-mono text-lg font-bold" style={{ color: c.match >= 85 ? '#16A34A' : c.match >= 70 ? '#D97706' : '#DC2626' }}>
                      {c.match}%
                    </div>
                  </div>
                </div>

                {/* Match bar */}
                <div className="mb-4">
                  <ProgressBar value={c.match} height={5} />
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5">
                  {c.skills.map((s) => {
                    const cfg = skillColor[s.status]
                    return (
                      <span
                        key={s.name}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${cfg.bg} ${cfg.text}`}
                      >
                        {cfg.icon} {s.name}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">
                TalentLens provides match insights only. The recruiter makes all hiring decisions.
              </p>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 border border-border text-xs text-muted-foreground rounded-lg hover:bg-muted transition-colors">
                  View Profile
                </button>
                <button className="px-3 py-1.5 bg-secondary text-secondary-foreground text-xs font-medium rounded-lg hover:bg-secondary/80 transition-colors">
                  Shortlist
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-5 border border-dashed border-border rounded-2xl text-center">
        <p className="text-sm font-medium text-foreground mb-1">More recruiter features coming soon</p>
        <p className="text-xs text-muted-foreground">Job management, pipeline tracking, and team collaboration.</p>
        <button
          onClick={() => onNav('landing')}
          className="mt-4 px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-xl hover:bg-secondary/80 transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  )
}
