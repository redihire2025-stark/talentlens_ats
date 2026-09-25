import {
  MAX_AI_PARSE_TEXT_LENGTH,
  PARSE_RESUME_SYSTEM_INSTRUCTION,
  buildParseUserText,
  coerceAiParsedResume,
} from '../../src/lib/ai/parseResumePrompt'
import type { AiParseResumeInput, AiParseResumeResult } from '../../src/lib/ai/parseResumePrompt'

/**
 * Server-side proxy for the AI-assisted resume-parsing FALLBACK. Same
 * security pattern as `rewrite-bullet.ts`: the OpenAI API key lives ONLY
 * here, as the server-side `OPENAI_API_KEY` environment variable (set in
 * Netlify's dashboard, never in a `VITE_*` variable) — see
 * docs/architecture/overview.md's "AI Layer" section. The client
 * (`src/lib/ai/aiParseResume.ts`) never sees the key; it only calls this
 * function's endpoint (`/.netlify/functions/parse-resume-ai`).
 *
 * This function takes already-extracted resume TEXT (pdfjs-dist/mammoth run
 * client-side) and returns the model's structured extraction, shape-checked
 * but otherwise UNVERIFIED. The client never uses that output directly: it
 * runs it through `src/lib/ai/groundAiExtraction.ts`, which drops every
 * value not found verbatim in the resume text, and the client only ever
 * calls this function for a resume the deterministic parser flagged with a
 * structural warning (see `src/lib/ai/aiAssistedParse.ts`).
 */

const MODEL = 'gpt-4o-mini'
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions'

// Same retry policy as rewrite-bullet.ts: 429 (rate limit / overload) and
// 503 (model temporarily unavailable) are worth a short retry; a bad key
// (401) or malformed request (400) is not.
const RETRYABLE_STATUSES = new Set([429, 503])
const MAX_ATTEMPTS = 3
const RETRY_DELAY_MS = 1500

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function callOpenAi(apiKey: string, input: AiParseResumeInput): Promise<AiParseResumeResult> {
  const userText = buildParseUserText(input)
  let lastError: AiParseResumeResult = { ok: false, error: 'OpenAI request failed for an unknown reason.' }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let response: Response
    try {
      response = await fetch(OPENAI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: PARSE_RESUME_SYSTEM_INSTRUCTION },
            { role: 'user', content: userText },
          ],
          // Extraction, not writing: no sampling creativity wanted.
          temperature: 0,
          max_tokens: 4000,
          response_format: { type: 'json_object' },
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
      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch {
        return { ok: false, error: 'OpenAI returned a response that was not valid JSON.' }
      }
      return { ok: true, data: coerceAiParsedResume(parsed) }
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

function json(statusCode: number, data: AiParseResumeResult): NetlifyResponse {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }
}

/**
 * POST { text } -> AiParseResumeResult. Never logs resume content (same
 * privacy rule as every `src/api/*` function — see docs/product/v1-scope.md).
 */
export async function handler(event: NetlifyEvent): Promise<NetlifyResponse> {
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed.' })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return json(200, { ok: false, error: 'No AI provider configured on the server.' })
  }

  let input: AiParseResumeInput
  try {
    const parsed = JSON.parse(event.body ?? '{}')
    if (typeof parsed?.text !== 'string' || !parsed.text.trim()) {
      return json(400, { ok: false, error: 'Resume text is required.' })
    }
    if (parsed.text.length > MAX_AI_PARSE_TEXT_LENGTH) {
      return json(413, { ok: false, error: 'Resume text is too long for AI-assisted parsing.' })
    }
    input = { text: parsed.text }
  } catch {
    return json(400, { ok: false, error: 'Invalid request body.' })
  }

  const result = await callOpenAi(apiKey, input)
  return json(200, result)
}
