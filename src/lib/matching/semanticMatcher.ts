import type { MatchStatus } from '@/types/score'

export interface SemanticMatchResult {
  term: string
  status: MatchStatus
  confidence: number
}

/**
 * AI-abstraction seam (see "AI ABSTRACTION" in AGENTS.md): an optional,
 * swappable enhancement over the deterministic matchers in this folder,
 * never a dependency of them. `skillMatcher.ts` and friends never call
 * this — a future caller could layer it in without changing any existing
 * matcher. Not wired into `matchResume` in V1.
 */
export interface SemanticMatcher {
  matchSkills(resumeSkills: string[], jdSkills: string[]): Promise<SemanticMatchResult[]>
}

/** The default, always-available implementation: no semantic enhancement, so the deterministic layers are always sufficient on their own. */
export class NoopSemanticMatcher implements SemanticMatcher {
  async matchSkills(_resumeSkills: string[], _jdSkills: string[]): Promise<SemanticMatchResult[]> {
    return []
  }
}
