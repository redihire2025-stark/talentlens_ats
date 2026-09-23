import { REWRITE_SYSTEM_INSTRUCTION, buildRewriteUserText, cleanRewriteOutput } from '../../src/lib/ai/rewritePrompt'
import type { AiRewriteInput, AiRewriteResult } from '../../src/lib/ai/rewritePrompt'

/**
 * Server-side proxy for the AI bullet-rewrite feature. The OpenAI API key
 * lives ONLY here, as the server-side `OPENAI_API_KEY` environment
 * variable (set in Netlify's dashboard, never in a `VITE_*` variable) —
 * see docs/architecture/overview.md's "AI Layer" section for why. The
 * client (`src/lib/ai/openaiClient.ts`) never sees the key; it only calls
 * this function's endpoint (`/.netlify/functions/rewrite-bullet`) and gets
 * back the same `AiRewriteResult` shape it used to build from OpenAI's raw
 * response directly.
 */

const MODEL = 'gpt-4o-mini'
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions'

// OpenAI returns 429 for both rate limits and momentary overload, and 503
// when a model is temporarily unavailable — both worth a short retry,
// unlike a bad key (401) or a malformed request (400).
const RETRYABLE_STATUSES = new Set([429, 503])
const MAX_ATTEMPTS = 3
const RETRY_DELAY_MS = 1500

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function callOpenAi(apiKey: string, input: AiRewriteInput): Promise<AiRewriteResult> {
  const userText = buildRewriteUserText(input)
  let lastError: AiRewriteResult = { ok: false, error: 'OpenAI request failed for an unknown reason.' }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let response: Response
    try {
      response = await fetch(OPENAI_ENDPOINT, {
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

interface NetlifyEvent {
  httpMethod: string
  body: string | null
}

interface NetlifyResponse {
  statusCode: number
  headers?: Record<string, string>
  body: string
}

function json(statusCode: number, data: AiRewriteResult): NetlifyResponse {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }
}

/**
 * POST { bullet, role?, company? } -> AiRewriteResult. Never logs resume
 * content (same privacy rule as every `src/api/*` function — see
 * docs/product/v1-scope.md).
 */
export async function handler(event: NetlifyEvent): Promise<NetlifyResponse> {
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed.' })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return json(200, { ok: false, error: 'No AI provider configured on the server.' })
  }

  let input: AiRewriteInput
  try {
    const parsed = JSON.parse(event.body ?? '{}')
    if (typeof parsed?.bullet !== 'string' || !parsed.bullet.trim()) {
      return json(400, { ok: false, error: 'A bullet is required.' })
    }
    input = { bullet: parsed.bullet, role: parsed.role, company: parsed.company }
  } catch {
    return json(400, { ok: false, error: 'Invalid request body.' })
  }

  const result = await callOpenAi(apiKey, input)
  return json(200, result)
}
