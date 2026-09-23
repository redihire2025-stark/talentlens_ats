import type { Evidence, EvidenceSection } from '@/types/evidence'

interface ScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
  showLabel?: boolean
}

export function ScoreRing({ score, size = 120, strokeWidth = 9, showLabel = true }: ScoreRingProps) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)
  const cx = size / 2
  const cy = size / 2

  const color = score >= 85 ? '#7C3AED' : score >= 70 ? '#D97706' : '#DC2626'

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1F1F2E" strokeWidth={strokeWidth} />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circ}`}
          strokeDashoffset={`${offset}`}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-mono font-bold leading-none"
            style={{ fontSize: size * 0.22, color: '#F0EEFF' }}
          >
            {score}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground mt-0.5">/100</span>
        </div>
      )}
    </div>
  )
}

interface ProgressBarProps {
  value: number
  color?: string
  height?: number
}

export function ProgressBar({ value, color, height = 6 }: ProgressBarProps) {
  const bg = color ?? (value >= 85 ? '#7C3AED' : value >= 70 ? '#D97706' : '#DC2626')
  return (
    <div
      className="w-full rounded-full bg-muted overflow-hidden"
      style={{ height }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${value}%`, backgroundColor: bg }}
      />
    </div>
  )
}

interface BadgeProps {
  status: 'strong' | 'good' | 'needs-improvement'
  label?: string
}

export function StatusBadge({ status, label }: BadgeProps) {
  const config = {
    strong: { bg: 'bg-success-bg', text: 'text-success', dot: 'bg-success', display: label ?? 'Strong' },
    good: { bg: 'bg-warning-bg', text: 'text-warning', dot: 'bg-warning', display: label ?? 'Good' },
    'needs-improvement': { bg: 'bg-critical-bg', text: 'text-critical', dot: 'bg-critical', display: label ?? 'Needs Improvement' },
  }
  const c = config[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.display}
    </span>
  )
}

export function ScoreColor(score: number) {
  return score >= 85 ? '#7C3AED' : score >= 70 ? '#D97706' : '#DC2626'
}

const EVIDENCE_SECTION_LABELS: Record<EvidenceSection, string> = {
  contact: 'Contact',
  summary: 'Summary',
  skills: 'Skills',
  experience: 'Experience',
  education: 'Education',
  projects: 'Projects',
  certifications: 'Certifications',
  other: 'Resume',
}

interface EvidenceListProps {
  evidence: Evidence[]
  /** Show at most this many items (the rest are summarized as "+N more"). */
  max?: number
}

/**
 * Where a score, match, or recommendation comes from, in the resume's own
 * words. A verbatim quote is shown in quotes; an `inferred-from-structure`
 * observation (e.g. "3 experience entries detected.") is labeled as such,
 * never presented as if the resume said it.
 */
export function EvidenceList({ evidence, max = 2 }: EvidenceListProps) {
  if (evidence.length === 0) return null
  const shown = evidence.slice(0, max)
  const hidden = evidence.length - shown.length
  return (
    <ul className="space-y-1">
      {shown.map((e, i) => (
        <li key={`${e.section}-${e.entryId ?? ''}-${i}`} className="text-[11px] leading-snug text-muted-foreground flex gap-1.5">
          <span className="flex-shrink-0 font-medium text-foreground/70">{EVIDENCE_SECTION_LABELS[e.section]}:</span>
          {e.sourceType === 'explicit' ? (
            <span className="italic truncate" title={e.text}>“{e.text}”</span>
          ) : (
            <span className="truncate" title={e.text}>
              {e.text} <span className="not-italic text-[10px] uppercase tracking-wider">(inferred)</span>
            </span>
          )}
        </li>
      ))}
      {hidden > 0 && <li className="text-[10px] text-muted-foreground">+{hidden} more</li>}
    </ul>
  )
}
