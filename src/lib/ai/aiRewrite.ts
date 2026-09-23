import { generateOpenAiRewrite } from './openaiClient'
import type { AiRewriteInput, AiRewriteResult } from './rewritePrompt'

export { sleep } from './rewritePrompt'
export type { AiRewriteInput, AiRewriteResult } from './rewritePrompt'

/**
 * Calls the server-side AI rewrite proxy to rewrite one resume bullet.
 * Never fabricates a fact — see the shared system prompt in
 * rewritePrompt.ts. There is deliberately no `isAiRewriteAvailable()`
 * check before calling this: the client has no way to know ahead of time
 * whether the server has an AI provider key configured (that key lives
 * only server-side — see openaiClient.ts), so callers always attempt this
 * and treat any failure, including "no provider configured", the same
 * way — a silent fallback to the deterministic suggestion already shown,
 * never a user-facing error (see src/components/Recommendations.tsx).
 */
export async function generateAiBulletRewrite(input: AiRewriteInput): Promise<AiRewriteResult> {
  return generateOpenAiRewrite(input)
}
