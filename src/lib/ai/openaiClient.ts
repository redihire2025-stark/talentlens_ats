import type { AiRewriteInput, AiRewriteResult } from './rewritePrompt'

/**
 * The client never holds, reads, or sends an OpenAI API key. It calls the
 * server-side Netlify Function proxy (`netlify/functions/rewrite-bullet.ts`)
 * instead, which reads the real key from a server-side environment
 * variable — see docs/architecture/overview.md's "AI Layer" section. A
 * `VITE_*` variable would be inlined into the shipped client bundle by
 * Vite at build time, which would leak the key to every visitor; this
 * function endpoint is the fix.
 */
const REWRITE_FUNCTION_ENDPOINT = '/.netlify/functions/rewrite-bullet'

/**
 * Calls the rewrite-bullet Netlify Function to rewrite one resume bullet
 * for stronger ATS phrasing. See rewritePrompt.ts for the shared
 * no-fabrication rules enforced server-side. The caller still shows the
 * result in an editable box before it's ever applied — this is a
 * suggestion, not an auto-write. The client has no way to know ahead of
 * time whether the server has a key configured, so it always attempts the
 * call and treats "no provider configured" the same as any other failure:
 * something the caller falls back from silently (the deterministic
 * suggestion already shown never depends on this succeeding).
 */
export async function generateOpenAiRewrite(input: AiRewriteInput): Promise<AiRewriteResult> {
  try {
    const response = await fetch(REWRITE_FUNCTION_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      return { ok: false, error: `AI rewrite request failed (HTTP ${response.status}).` }
    }

    const result = (await response.json()) as AiRewriteResult
    return result
  } catch {
    return { ok: false, error: 'Could not reach the AI rewrite service — check your network connection.' }
  }
}
