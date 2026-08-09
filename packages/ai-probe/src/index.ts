import { generateObject } from "ai";
import { z } from "zod";
import type {
  AiProvider,
  BusinessIdentity,
  ProbeAttempt,
  ProbeResult,
  ProviderSummary,
} from "@aiv/contracts";
import { AI_PROVIDERS } from "@aiv/contracts";
import { buildQueries } from "./queries.js";
import { matchBusiness } from "./match.js";
import { PROVIDER_MODELS } from "./providers.js";
import { runWithConcurrencyLimit } from "./concurrency.js";

// See concurrency.ts: bounding in-flight requests avoids tripping the
// gateway's free-tier rate limit that a full Promise.all fan-out hits, and
// pacing request starts avoids exhausting a per-minute quota partway
// through a run (concurrency alone wasn't enough — see concurrency.ts).
const MAX_CONCURRENT_REQUESTS = 3;
const REQUEST_PACING_MS = 500;

const EXCERPT_MAX_CHARS = 400;

// Vercel AI Gateway caches identical (model, prompt) requests server-side —
// the single biggest lever for "cost less credit" here, since re-running
// probe() on the same business during dev/testing (or a corpus:run re-run)
// costs nothing extra within the window instead of re-spending real credit.
// 24h is long enough to cover a full dev session or CI re-run, short enough
// that production usage (probing the same business at most a few times a
// week) never serves a meaningfully stale answer. Set to 0 to force a fresh
// call, e.g. when verifying that a real prompt/model change actually
// altered the AI's response rather than replaying a cached one.
const DEFAULT_CACHE_TTL_SECONDS = 86400;

const RESPONSE_SCHEMA = z.object({
  answer: z.string().describe("Your natural-language answer to the question, exactly as you'd say it to a real user."),
  mentioned_businesses: z
    .array(z.string())
    .describe("Every specific business name you mentioned in the answer, in the order mentioned."),
});

export interface ProbeOptions {
  /** Override the default model for one or more providers, e.g. once paid gateway credits are available. */
  models?: Partial<Record<AiProvider, string>>;
  /** Gateway response cache TTL in seconds. Default DEFAULT_CACHE_TTL_SECONDS (24h). 0 disables caching. */
  cacheTtlSeconds?: number;
  /** Delay in ms between paced request starts. Default REQUEST_PACING_MS (500ms). 0 disables pacing — only
   * safe with a mocked/fake network (tests); against the real gateway this reintroduces the quota-exhaustion
   * failure documented in concurrency.ts. */
  pacingMs?: number;
}

async function runOneAttempt(
  provider: AiProvider,
  model: string,
  query: string,
  business: BusinessIdentity,
  cacheTtlSeconds: number,
): Promise<ProbeAttempt> {
  try {
    const { object } = await generateObject({
      model,
      schema: RESPONSE_SCHEMA,
      prompt: `Answer this question naturally, exactly as you would for a real user asking casually: "${query}"`,
      ...(cacheTtlSeconds > 0
        ? { providerOptions: { gateway: { cacheControl: `max-age=${cacheTtlSeconds}` } } }
        : {}),
    });

    const match = matchBusiness(object.mentioned_businesses, business);

    return {
      provider,
      model,
      query,
      mentioned: match.mentioned,
      mention_position: match.mention_position,
      competitors_mentioned: match.competitors_mentioned,
      response_excerpt: object.answer.slice(0, EXCERPT_MAX_CHARS),
      error: null,
    };
  } catch (err) {
    // Never throw: a provider failure is data (an attempt with error set),
    // not a crash — mirrors the Scanner Agent's guardrail exactly.
    return {
      provider,
      model,
      query,
      mentioned: false,
      mention_position: null,
      competitors_mentioned: [],
      response_excerpt: "",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function summarizeProvider(provider: AiProvider, attempts: ProbeAttempt[]): ProviderSummary {
  const providerAttempts = attempts.filter((a) => a.provider === provider);
  const mentioned = providerAttempts.filter((a) => a.mentioned);
  const positions = mentioned
    .map((a) => a.mention_position)
    .filter((p): p is number => p !== null);

  return {
    provider,
    queries_run: providerAttempts.length,
    times_mentioned: mentioned.length,
    mention_rate: providerAttempts.length > 0 ? mentioned.length / providerAttempts.length : 0,
    avg_mention_position:
      positions.length > 0 ? positions.reduce((a, b) => a + b, 0) / positions.length : null,
  };
}

const HIGH_CONFIDENCE_MAX_ERRORS = 0;

function computeProbeConfidence(attempts: ProbeAttempt[]): ProbeResult["probe_confidence"] {
  if (attempts.length === 0) return "low";
  const erroredCount = attempts.filter((a) => a.error !== null).length;
  if (erroredCount > HIGH_CONFIDENCE_MAX_ERRORS && erroredCount <= attempts.length / 2) return "medium";
  if (erroredCount > attempts.length / 2) return "low";
  return "high";
}

/**
 * Queries every provider in AI_PROVIDERS with a fixed set of realistic
 * local-search prompts and reports whether/how the business gets mentioned.
 * Like Scanner's scan(), this never throws — a single provider failure is
 * captured as an errored ProbeAttempt, logged in probe_issues, and reflected
 * in a downgraded probe_confidence, not a crash.
 */
export async function probe(business: BusinessIdentity, options: ProbeOptions = {}): Promise<ProbeResult> {
  const queries = buildQueries(business);
  const cacheTtlSeconds = options.cacheTtlSeconds ?? DEFAULT_CACHE_TTL_SECONDS;

  const tasks: (() => Promise<ProbeAttempt>)[] = [];
  for (const provider of AI_PROVIDERS) {
    const model = options.models?.[provider] ?? PROVIDER_MODELS[provider];
    for (const query of queries) {
      tasks.push(() => runOneAttempt(provider, model, query, business, cacheTtlSeconds));
    }
  }

  const pacingMs = options.pacingMs ?? REQUEST_PACING_MS;
  const attempts = await runWithConcurrencyLimit(tasks, MAX_CONCURRENT_REQUESTS, pacingMs);

  const probe_issues = attempts
    .filter((a) => a.error !== null)
    .map((a) => `${a.provider} (${a.model}) failed on "${a.query}": ${a.error}`);

  const provider_summaries = AI_PROVIDERS.map((p) => summarizeProvider(p, attempts));
  const mentionedCount = attempts.filter((a) => a.mentioned).length;
  const overall_mention_rate = attempts.length > 0 ? mentionedCount / attempts.length : 0;

  return {
    business,
    probed_at: new Date().toISOString(),
    attempts,
    provider_summaries,
    overall_mention_rate,
    probe_confidence: computeProbeConfidence(attempts),
    probe_issues,
  };
}

export * from "./queries.js";
export * from "./match.js";
export * from "./providers.js";
export * from "./concurrency.js";
