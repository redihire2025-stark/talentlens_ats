import { REWRITE_SYSTEM_INSTRUCTION, buildRewriteUserText, cleanRewriteOutput, sleep } from './rewritePrompt'
import type { AiRewriteInput, AiRewriteResult } from './rewritePrompt'

const MODEL = 'gemini-flash-latest'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

function getApiKey(): string | undefined {
  return import.meta.env.VITE_GEMINI_API_KEY as string | undefined
}

export function hasGeminiKey(): boolean {
  return Boolean(getApiKey())
}

// Google's own servers return 503 UNAVAILABLE / 429 RESOURCE_EXHAUSTED when
// gemini-flash-latest is under high demand — both are transient, worth a
// short retry, unlike a bad key (401/403) or a malformed request (400).
const RETRYABLE_STATUSES = new Set([429, 503])
const MAX_ATTEMPTS = 3
const RETRY_DELAY_MS = 1500

/**
 * Calls Gemini to rewrite one resume bullet for stronger ATS phrasing. See
 * rewritePrompt.ts for the shared no-fabrication rules. The caller still
 * shows the result in an editable box before it's ever applied — this is a
 * suggestion, not an auto-write.
 */
export async function generateGeminiRewrite(input: AiRewriteInput): Promise<AiRewriteResult> {
  const apiKey = getApiKey()
  if (!apiKey) {
    return { ok: false, error: 'No Gemini API key configured (VITE_GEMINI_API_KEY).' }
  }

  const userText = buildRewriteUserText(input)
  let lastError: AiRewriteResult = { ok: false, error: 'Gemini request failed for an unknown reason.' }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let response: Response
    try {
      response = await fetch(`${ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: REWRITE_SYSTEM_INSTRUCTION }] },
          contents: [{ parts: [{ text: userText }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 200 },
        }),
      })
    } catch {
      lastError = { ok: false, error: 'Could not reach the Gemini API — check your network connection.' }
      break
    }

    if (response.ok) {
      const data = await response.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined
      if (!text || !text.trim()) return { ok: false, error: 'Gemini returned an empty response.' }
      return { ok: true, text: cleanRewriteOutput(text) }
    }

    const status = response.status
    if (status === 401 || status === 403) {
      return { ok: false, error: 'Gemini API key was rejected (401/403). Check the key.' }
    }

    if (RETRYABLE_STATUSES.has(status) && attempt < MAX_ATTEMPTS) {
      lastError = { ok: false, error: `Gemini is temporarily overloaded (HTTP ${status}). Retrying…` }
      await sleep(RETRY_DELAY_MS * attempt)
      continue
    }

    const suffix = RETRYABLE_STATUSES.has(status) ? ' Gemini is overloaded right now.' : ''
    return { ok: false, error: `Gemini API request failed (HTTP ${status}).${suffix}` }
  }

  return lastError
}
