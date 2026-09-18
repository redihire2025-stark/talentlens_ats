import { generateOpenAiRewrite, hasOpenAiKey } from './openaiClient'
import type { AiRewriteInput, AiRewriteResult } from './rewritePrompt'

export { sleep } from './rewritePrompt'
export type { AiRewriteInput, AiRewriteResult } from './rewritePrompt'

export function isAiRewriteAvailable(): boolean {
  return hasOpenAiKey()
}

/**
 * Calls OpenAI to rewrite one resume bullet. Never fabricates a fact — see
 * the shared system prompt in rewritePrompt.ts.
 */
export async function generateAiBulletRewrite(input: AiRewriteInput): Promise<AiRewriteResult> {
  if (!hasOpenAiKey()) {
    return { ok: false, error: 'No AI provider configured (set VITE_OPENAI_API_KEY).' }
  }

  return generateOpenAiRewrite(input)
}
