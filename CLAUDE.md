# CLAUDE.md — operating rules for this repo

## AI-Probe: credit discipline (read before touching `packages/ai-probe`)

`packages/ai-probe` spends **real money** per real network call (Vercel AI
Gateway, billed per token across OpenAI/Anthropic/Google/Perplexity). Follow
this route every time, in order:

1. **Routine work — `npm test` / `npm run test:ai-probe` — never touches the
   network.** The whole suite mocks `generateObject`. If a change makes a
   test suddenly slow or you feel tempted to hit the real gateway "just to
   check," that's a sign the test should be mocked instead, not a reason to
   spend credit.
2. **Never write a new ad-hoc real-network smoke-test script.** Past sessions
   did this repeatedly during debugging (multiple scratch scripts, each a
   real paid call) when the existing `packages/ai-probe/scripts/run_corpus.ts`
   or a single `probe()` call would have answered the same question for less.
   If you need to verify real behavior, make **one** minimal call — a single
   provider, a single query — not the full 4x4 matrix.
3. **`corpus:run` is a deliberate, occasional action, not a debugging
   loop.** It makes 32 real calls (2 businesses x 4 providers x 4 queries).
   Before running it, ask: has anything changed that could plausibly alter
   the *matching/scoring logic* being validated, or are you actually
   debugging *gateway connectivity/billing*? For the latter, a single
   `probe()` call (or even just `generateObject` directly) is enough — don't
   reach for the full corpus.
4. **Caching is on by default (`cacheTtlSeconds`, 24h) — don't disable it
   casually.** Re-running the same business within a day reuses the cached
   gateway response for free. Only pass `cacheTtlSeconds: 0` when you are
   specifically verifying that a prompt or model change altered the AI's
   real output — and say so in the commit/PR, since it's the one case that
   deliberately spends fresh credit to prove something.
5. **Don't lower `pacingMs` or raise `MAX_CONCURRENT_REQUESTS` to "make it
   faster" without re-reading `packages/ai-probe/src/concurrency.ts`'s
   comments first.** Both were raised from real, reproduced failures (see
   README's "Known limitation" section under AI-Probe). Reverting them
   reintroduces a documented bug, not a performance win.
6. **Default models are the confirmed-free-tier-accessible budget tier**
   (`packages/ai-probe/src/providers.ts`). Don't switch defaults to flagship
   models (`gpt-5-mini`, `gemini-3-flash`, `sonar-pro`, etc.) without the
   user explicitly confirming they've added *paid* gateway credit (a card on
   file alone does not unlock these — see README). Per-call overrides via
   `probe(business, { models: {...} })` are fine when the user asks for
   higher fidelity on a specific run.
7. **If a real run comes back `probe_confidence: "low"` with rate-limit
   errors, don't retry it repeatedly hoping it clears.** Each retry spends
   real credit on calls that already failed once for a structural reason
   (see README). Report the result once, clearly, and let the user decide
   whether to top up credit or accept the lower-confidence signal — mirror
   how Scanner reports a low-confidence scan rather than silently re-scanning.

## General

- Scanner (`packages/scanner`), Scoring (`packages/scoring`), and AI-Probe
  (`packages/ai-probe`) are independent agents sharing only
  `packages/contracts`. Never let one import another directly — the
  integration package is the only place they're wired together.
- Full architecture and current build status: see the `optweb-agent-architecture`
  memory (13-agent OPTWEB system; only agents 4-6 are built so far).
- Before claiming a fix works, run the actual test suite (`npm test`) — see
  `verification-before-completion` practice. Don't assert success from
  reading code alone.
