# lib/ai

The one AI-backed feature in the app: an optional, non-authoritative
bullet-rewrite suggestion. See `docs/architecture/overview.md`'s "AI Layer"
section for the full request flow and why the API key lives server-side.

- `rewritePrompt.ts` — the shared system prompt and no-fabrication rules,
  plus pure string helpers (`buildRewriteUserText`, `cleanRewriteOutput`).
  No browser-only dependencies, so it's imported by both the client
  (`openaiClient.ts`) and the server-side Netlify Function
  (`netlify/functions/rewrite-bullet.ts`).
- `openaiClient.ts` — the client-side caller. Never holds an API key; it
  POSTs to `/.netlify/functions/rewrite-bullet` and returns whatever
  `AiRewriteResult` comes back.
- `aiRewrite.ts` — the public entry point (`generateAiBulletRewrite`) that
  `src/components/Recommendations.tsx` calls. There's deliberately no
  "is AI available" check before calling it: the client can't know ahead
  of time whether the server has `OPENAI_API_KEY` configured, so every
  caller always attempts the call and treats any failure — including "no
  provider configured" — as a silent, expected fallback to the
  deterministic suggestion already shown (see `bulletImpactRecommendations.ts`
  / `src/lib/ats/bulletQuality.ts`'s `buildDeterministicBulletSuggestion`).

## Local development

`netlify dev` (Netlify CLI) runs the Vite dev server and
`netlify/functions/rewrite-bullet.ts` together, so `/.netlify/functions/rewrite-bullet`
resolves locally the same way it does in production. Set `OPENAI_API_KEY`
in a local `.env` file (never committed — it's server-side only, not a
`VITE_*` variable) or your shell environment before running it. Without a
plain `pnpm dev`, the function endpoint won't exist — the client's fetch to
it will fail, and the bullet-rewrite feature falls back to the
deterministic suggestion, exactly as it does when the server has no key
configured.
