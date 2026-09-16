import { REWRITE_SYSTEM_INSTRUCTION, buildRewriteUserText, cleanRewriteOutput, sleep } from './rewritePrompt'
import type { AiRewriteInput, AiRewriteResult } from './rewritePrompt'

// Groq exposes an OpenAI-compatible Chat Completions API. gpt-oss is a
// reasoning model: without reasoning_effort pinned low and a token budget
// that covers both the hidden reasoning and the visible answer, it can burn
// the whole max_tokens budget on reasoning and return empty content.
const MODEL = 'openai/gpt-oss-120b'
const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'

function getApiKey(): string | undefined {
  return import.meta.env.VITE_GROQ_API_KEY as string | undefined
}

export function hasGroqKey(): boolean {
  return Boolean(getApiKey())
}

const RETRYABLE_STATUSES = new Set([429, 503])
const MAX_ATTEMPTS = 2
const RETRY_DELAY_MS = 1000

/**
 * Fallback provider for generateAiBulletRewrite (see aiRewrite.ts) — used
 * only when Gemini is unavailable or its own attempts all fail. Same
 * no-fabrication system prompt as Gemini (rewritePrompt.ts), so the result
 * reads the same regardless of which provider actually answered.
 */
export async function generateGroqRewrite(input: AiRewriteInput): Promise<AiRewriteResult> {
  const apiKey = getApiKey()
  if (!apiKey) {
    return { ok: false, error: 'No Groq API key configured (VITE_GROQ_API_KEY).' }
  }

  const userText = buildRewriteUserText(input)
  let lastError: AiRewriteResult = { ok: false, error: 'Groq request failed for an unknown reason.' }

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
          max_tokens: 400,
          reasoning_effort: 'low',
        }),
      })
    } catch {
      lastError = { ok: false, error: 'Could not reach the Groq API — check your network connection.' }
      break
    }

    if (response.ok) {
      const data = await response.json()
      const text = data?.choices?.[0]?.message?.content as string | undefined
      if (!text || !text.trim()) return { ok: false, error: 'Groq returned an empty response.' }
      return { ok: true, text: cleanRewriteOutput(text) }
    }

    const status = response.status
    if (status === 401 || status === 403) {
      return { ok: false, error: 'Groq API key was rejected (401/403). Check the key.' }
    }

    if (RETRYABLE_STATUSES.has(status) && attempt < MAX_ATTEMPTS) {
      lastError = { ok: false, error: `Groq is temporarily overloaded (HTTP ${status}). Retrying…` }
      await sleep(RETRY_DELAY_MS * attempt)
      continue
    }

    return { ok: false, error: `Groq API request failed (HTTP ${status}).` }
  }

  return lastError
}
