import { REWRITE_SYSTEM_INSTRUCTION, buildRewriteUserText, cleanRewriteOutput, sleep } from './rewritePrompt'
import type { AiRewriteInput, AiRewriteResult } from './rewritePrompt'

const MODEL = 'gpt-4o-mini'
const ENDPOINT = 'https://api.openai.com/v1/chat/completions'

function getApiKey(): string | undefined {
  return import.meta.env.VITE_OPENAI_API_KEY as string | undefined
}

export function hasOpenAiKey(): boolean {
  return Boolean(getApiKey())
}

// OpenAI returns 429 for both rate limits and momentary overload, and 503
// when a model is temporarily unavailable — both worth a short retry,
// unlike a bad key (401) or a malformed request (400).
const RETRYABLE_STATUSES = new Set([429, 503])
const MAX_ATTEMPTS = 3
const RETRY_DELAY_MS = 1500

/**
 * Calls OpenAI to rewrite one resume bullet for stronger ATS phrasing. See
 * rewritePrompt.ts for the shared no-fabrication rules. The caller still
 * shows the result in an editable box before it's ever applied — this is a
 * suggestion, not an auto-write.
 */
export async function generateOpenAiRewrite(input: AiRewriteInput): Promise<AiRewriteResult> {
  const apiKey = getApiKey()
  if (!apiKey) {
    return { ok: false, error: 'No OpenAI API key configured (VITE_OPENAI_API_KEY).' }
  }

  const userText = buildRewriteUserText(input)
  let lastError: AiRewriteResult = { ok: false, error: 'OpenAI request failed for an unknown reason.' }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let response: Response
    try {
      response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: REWRITE_SYSTEM_INSTRUCTION },
            { role: 'user', content: userText },
          ],
          temperature: 0.4,
          max_tokens: 200,
        }),
      })
    } catch {
      lastError = { ok: false, error: 'Could not reach the OpenAI API — check your network connection.' }
      break
    }

    if (response.ok) {
      const data = await response.json()
      const text = data?.choices?.[0]?.message?.content as string | undefined
      if (!text || !text.trim()) return { ok: false, error: 'OpenAI returned an empty response.' }
      return { ok: true, text: cleanRewriteOutput(text) }
    }

    const status = response.status
    if (status === 401 || status === 403) {
      return { ok: false, error: 'OpenAI API key was rejected (401/403). Check the key.' }
    }

    if (RETRYABLE_STATUSES.has(status) && attempt < MAX_ATTEMPTS) {
      lastError = { ok: false, error: `OpenAI is temporarily overloaded (HTTP ${status}). Retrying…` }
      await sleep(RETRY_DELAY_MS * attempt)
      continue
    }

    const suffix = RETRYABLE_STATUSES.has(status) ? ' OpenAI is overloaded right now.' : ''
    return { ok: false, error: `OpenAI API request failed (HTTP ${status}).${suffix}` }
  }

  return lastError
}
