import type { AiProvider } from "@aiv/contracts";

/**
 * Default gateway model per provider. Chosen to be the confirmed-accessible
 * budget tier on Vercel AI Gateway's free plan (verified 2026-08-08) — the
 * flagship models from openai/google/perplexity are rate-limited without
 * paid gateway credits, while anthropic's Sonnet tier is available free.
 * Override per-call via probe(business, { models: {...} }) once credits are
 * available for higher-fidelity probing.
 */
export const PROVIDER_MODELS: Record<AiProvider, string> = {
  anthropic: "anthropic/claude-3-haiku",
  openai: "openai/gpt-4o-mini",
  google: "google/gemini-2.5-flash-lite",
  perplexity: "perplexity/sonar",
};
