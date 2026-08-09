import type { ProbeResult } from "@aiv/contracts";

/**
 * AI visibility — 20 pts. Proportional to overall_mention_rate: how often
 * the business was actually surfaced across every probe query and provider.
 *
 * JUDGMENT CALL: v1 deliberately does not weight mention *position* (being
 * named first vs. last in a list) — only whether the business was mentioned
 * at all. Position-weighting is a reasonable v2 refinement once there's
 * real-world data on how much rank actually matters to referral traffic;
 * baking in an unvalidated position-weight formula now would be exactly the
 * kind of premature-precision the rest of this rubric avoids.
 *
 * JUDGMENT CALL: this category has no corresponding top_fixes entries.
 * Unlike the other five categories, there is no direct lever to pull for
 * "improve ai_visibility" — the only real fix path is closing the gaps the
 * other five categories already surface (schema, rendering, crawler access,
 * accessibility, extractability) and re-probing later to confirm it moved.
 * Suggesting a fake direct fix here would be circular.
 */
export const AI_VISIBILITY_MAX = 20;

export function scoreAiVisibility(probe: ProbeResult): number {
  const rate = Math.min(1, Math.max(0, probe.overall_mention_rate));
  return AI_VISIBILITY_MAX * rate;
}
