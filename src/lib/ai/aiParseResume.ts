import type { AiParseResumeInput, AiParseResumeResult } from './parseResumePrompt'

export type { AiParseResumeInput, AiParseResumeResult, AiParsedResume } from './parseResumePrompt'

/**
 * Same key-handling rule as openaiClient.ts: the client never holds, reads,
 * or sends an OpenAI API key (no `VITE_*` variable exists for it). It only
 * calls the server-side Netlify Function, which reads `OPENAI_API_KEY` from
 * its own environment — see docs/architecture/overview.md's "AI Layer".
 */
export const PARSE_RESUME_FUNCTION_ENDPOINT = '/.netlify/functions/parse-resume-ai'

/** Upper bound on how long the processing screen waits for the fallback before giving up and keeping the deterministic result. */
export const AI_PARSE_TIMEOUT_MS = 30_000

/**
 * Asks the parse-resume-ai function for a structured extraction of the
 * given resume text. The returned `data` is UNVERIFIED model output — the
 * only caller (`aiAssistedParse.ts`) runs it through `groundAiExtraction`
 * before any of it can reach a Resume.
 *
 * Never throws. Any failure — network error, timeout, non-2xx, "no provider
 * configured" — comes back as `{ ok: false }`, which the caller treats as a
 * silent fallback to the deterministic parse (no user-facing error, same as
 * the bullet-rewrite feature).
 */
export async function requestAiResumeParse(input: AiParseResumeInput, timeoutMs = AI_PARSE_TIMEOUT_MS): Promise<AiParseResumeResult> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null
  try {
    const response = await fetch(PARSE_RESUME_FUNCTION_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input.text }),
      signal: controller?.signal,
    })

    if (!response.ok) {
      return { ok: false, error: `AI parse request failed (HTTP ${response.status}).` }
    }

    const result = (await response.json()) as AiParseResumeResult
    if (!result || typeof result !== 'object' || typeof result.ok !== 'boolean') {
      return { ok: false, error: 'AI parse service returned an unexpected response.' }
    }
    return result
  } catch {
    return { ok: false, error: 'Could not reach the AI parse service (network error or timeout).' }
  } finally {
    if (timer) clearTimeout(timer)
  }
}
