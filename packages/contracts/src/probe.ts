/**
 * ProbeResult is the contract between the AI-Probe Agent and the Scoring
 * Agent, exactly parallel to how Findings is the contract between Scanner
 * and Scoring. Scoring's `probe` parameter is optional — a Scorecard can
 * still be produced from Findings alone, so this is an additive contract
 * change, not a breaking one, for anyone already calling score(findings).
 */

export const AI_PROVIDERS = ["anthropic", "openai", "google", "perplexity"] as const;
export type AiProvider = (typeof AI_PROVIDERS)[number];

export interface BusinessIdentity {
  name: string;
  /** e.g. "BBQ restaurant", "plumber", "dentist" — used to build realistic local-search queries. */
  category: string;
  city: string;
  region?: string;
  country?: string;
  /** Cross-references Scanner's Findings.url when both agents are run for the same business. */
  website?: string;
  /** Alternate names/spellings the business might be recognized by (e.g. "Katz's" for "Katz's Delicatessen"). */
  aliases?: string[];
}

export interface ProbeAttempt {
  provider: AiProvider;
  /** Exact gateway model id used, e.g. "anthropic/claude-sonnet-4.6" — pinned per attempt for auditability. */
  model: string;
  query: string;
  mentioned: boolean;
  /** 1-based rank among businesses named in the response; null if not mentioned or the response wasn't a ranked list. */
  mention_position: number | null;
  /** Other business names the model surfaced instead of, or alongside, the target. */
  competitors_mentioned: string[];
  /** Truncated raw model response, kept for audit/evidence — never used as a scoring input directly. */
  response_excerpt: string;
  /** Populated only when this specific provider call failed; the attempt is still returned, never thrown. */
  error: string | null;
}

export interface ProviderSummary {
  provider: AiProvider;
  queries_run: number;
  times_mentioned: number;
  /** 0-1. */
  mention_rate: number;
  /** Average 1-based rank across mentions; null if never mentioned. */
  avg_mention_position: number | null;
}

export interface ProbeResult {
  business: BusinessIdentity;
  probed_at: string; // ISO 8601
  attempts: ProbeAttempt[];
  provider_summaries: ProviderSummary[];
  /** 0-1 across all attempts, all providers. */
  overall_mention_rate: number;
  /** Mirrors Findings.scan_confidence: degrades when providers error out or rate-limit. */
  probe_confidence: "high" | "medium" | "low";
  /** Mirrors Findings.scan_issues: non-fatal problems, logged not thrown. */
  probe_issues: string[];
}
