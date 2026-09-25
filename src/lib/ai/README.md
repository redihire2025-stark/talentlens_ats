# lib/ai

Two AI-backed features, both optional and non-authoritative. See
`docs/architecture/overview.md`'s "AI Layer" section for the full request
flows and why the API key lives server-side.

1. **Bullet-rewrite suggestions** (below).
2. **AI-assisted resume-parsing fallback**, added later by explicit
   product decision (see `docs/architecture/resume-parser.md`):
   - `parseResumePrompt.ts`: the extract-only system prompt, the
     `AiParsedResume` shape, and `coerceAiParsedResume`, which checks
     shape only. Shared with `netlify/functions/parse-resume-ai.ts`.
   - `aiParseResume.ts`: the client caller. It POSTs `{ text }` to
     `/.netlify/functions/parse-resume-ai`, holds no key, never throws,
     and times out after 30s.
   - `groundAiExtraction.ts`: **the safety layer.** It drops every AI
     value that doesn't appear verbatim in the resume text, and keeps the
     resume's own text span for each value that does.
   - `mergeAiParse.ts`: `aiAssistTargets` decides whether to call the AI
     at all (only on specific parser warnings).
     `mergeGroundedAiParse` fills only the flagged, empty fields.
   - `aiAssistedParse.ts`: the orchestrator, run as
     target check → call → ground → merge. There is no path from the
     model's response to a Resume that skips grounding. On any failure it
     returns the deterministic Resume unchanged.

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

`netlify dev` (Netlify CLI) runs the Vite dev server and both
`netlify/functions/rewrite-bullet.ts` and `netlify/functions/parse-resume-ai.ts`
together, so `/.netlify/functions/*` resolves locally the same way it does in production. Set `OPENAI_API_KEY`
in a local `.env` file (never committed — it's server-side only, not a
`VITE_*` variable) or your shell environment before running it. Without a
plain `pnpm dev`, the function endpoint won't exist — the client's fetch to
it will fail, and the bullet-rewrite feature falls back to the
deterministic suggestion (and the parsing fallback keeps the deterministic
parse), exactly as when the server has no key configured.
