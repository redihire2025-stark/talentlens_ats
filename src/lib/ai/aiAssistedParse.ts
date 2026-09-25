import type { Resume } from '@/types/resume'
import { requestAiResumeParse } from './aiParseResume'
import { groundAiExtraction } from './groundAiExtraction'
import { aiAssistTargets, mergeGroundedAiParse, needsAiAssist } from './mergeAiParse'
import { MAX_AI_PARSE_TEXT_LENGTH, type AiParseResumeInput, type AiParseResumeResult } from './parseResumePrompt'

/**
 * - `not-needed` — the rule-based parse had no warning the fallback addresses. No network call was made.
 * - `skipped` — it did, but the text is empty or too long to send. No network call was made.
 * - `failed` — the AI call failed (no key configured, network, timeout, bad response). Deterministic result kept.
 * - `no-change` — the call succeeded, but nothing verified that could fill a flagged field. Deterministic result kept.
 * - `applied` — verified values filled at least one flagged field.
 */
export type AiAssistStatus = 'not-needed' | 'skipped' | 'failed' | 'no-change' | 'applied'

export interface AiAssistOutcome {
  resume: Resume
  status: AiAssistStatus
  filledFields: string[]
}

export interface AiAssistDeps {
  /** The network boundary — injectable so tests never make a real call. Defaults to the Netlify Function caller. */
  requestParse?: (input: AiParseResumeInput) => Promise<AiParseResumeResult>
}

/**
 * The AI-assisted parsing fallback, end to end:
 *
 * 1. The rule-based Resume (already produced, unconditionally, by
 *    `parseResumeText`) is checked for warnings naming a structural problem
 *    (`aiAssistTargets`). None → return immediately: **no resume text is
 *    sent anywhere for a resume that parsed cleanly.**
 * 2. Otherwise the same extracted text goes to the parse-resume-ai function.
 * 3. Its output ALWAYS goes through `groundAiExtraction` — every value not
 *    found verbatim in the text is dropped. There is no code path from the
 *    model's response to the Resume that skips this step.
 * 4. The grounded values fill only the flagged, still-empty fields
 *    (`mergeGroundedAiParse`).
 *
 * Never throws and never blocks the upload: any failure returns the
 * deterministic Resume unchanged (same silent fallback as the bullet-rewrite
 * feature).
 */
export async function assistParseWithAi(resume: Resume, rawText: string, deps: AiAssistDeps = {}): Promise<AiAssistOutcome> {
  const targets = aiAssistTargets(resume)
  if (!needsAiAssist(targets)) return { resume, status: 'not-needed', filledFields: [] }

  const text = rawText.trim()
  if (!text || text.length > MAX_AI_PARSE_TEXT_LENGTH) return { resume, status: 'skipped', filledFields: [] }

  const requestParse = deps.requestParse ?? requestAiResumeParse
  let result: AiParseResumeResult
  try {
    result = await requestParse({ text })
  } catch {
    return { resume, status: 'failed', filledFields: [] }
  }
  if (!result.ok) return { resume, status: 'failed', filledFields: [] }

  try {
    const grounded = groundAiExtraction(result.data, text)
    const merged = mergeGroundedAiParse(resume, grounded.data, text, targets, grounded.rejected.length)
    if (merged.filledFields.length === 0) return { resume, status: 'no-change', filledFields: [] }
    return { resume: merged.resume, status: 'applied', filledFields: merged.filledFields }
  } catch {
    return { resume, status: 'failed', filledFields: [] }
  }
}
