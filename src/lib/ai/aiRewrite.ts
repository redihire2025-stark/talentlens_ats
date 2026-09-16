import { generateGeminiRewrite, hasGeminiKey } from './geminiClient'
import { generateGroqRewrite, hasGroqKey } from './groqClient'
import type { AiRewriteInput, AiRewriteResult } from './rewritePrompt'

export { sleep } from './rewritePrompt'
export type { AiRewriteInput, AiRewriteResult } from './rewritePrompt'

export function isAiRewriteAvailable(): boolean {
  return hasGeminiKey() || hasGroqKey()
}

/**
 * Tries Gemini first; if it's not configured, or every one of its own
 * retries fails (rate-limited, overloaded, network error), falls back to
 * Groq when a Groq key is configured. Never fabricates a fact either way —
 * both providers share the same system prompt (rewritePrompt.ts).
 */
export async function generateAiBulletRewrite(input: AiRewriteInput): Promise<AiRewriteResult> {
  if (hasGeminiKey()) {
    const primary = await generateGeminiRewrite(input)
    if (primary.ok) return primary
    if (!hasGroqKey()) return primary

    const fallback = await generateGroqRewrite(input)
    if (fallback.ok) return fallback
    return { ok: false, error: `Gemini failed (${primary.error}) and Groq fallback also failed (${fallback.error}).` }
  }

  if (hasGroqKey()) return generateGroqRewrite(input)

  return { ok: false, error: 'No AI provider configured (set VITE_GEMINI_API_KEY or VITE_GROQ_API_KEY).' }
}
