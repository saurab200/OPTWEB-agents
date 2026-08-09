import type { Findings, ProbeResult, Scorecard } from "@aiv/contracts";
import { scoreSchema } from "./rubric/schema.js";
import { scoreRendering } from "./rubric/rendering.js";
import { scoreCrawlerAccess } from "./rubric/crawlerAccess.js";
import { scoreAccessibility } from "./rubric/accessibility.js";
import { scoreExtractability } from "./rubric/extractability.js";
import { scoreAiVisibility, AI_VISIBILITY_MAX } from "./rubric/aiVisibility.js";
import { computeTopFixes } from "./rubric/topFixes.js";

const BASE_SCORE_MAX = 100;

/**
 * Pure deterministic rules applied to a Findings object (and, optionally, a
 * ProbeResult from the AI-Probe Agent). Zero LLM calls, zero judgment at
 * call time — every judgment call this rubric required was made once, at
 * implementation time, and is documented inline in rubric/*.ts and in the
 * README. Same inputs in, same Scorecard out, always.
 *
 * `probe` is optional and additive: omitting it reproduces the original
 * 5-category, 100-point rubric exactly (no behavior change for existing
 * callers). Supplying it adds a 6th ai_visibility category worth
 * AI_VISIBILITY_MAX more points, and total_score_max reports the resulting
 * ceiling (100 or 120) so consumers never have to assume which rubric ran.
 */
export function score(findings: Findings, probe?: ProbeResult): Scorecard {
  const schema = Math.round(scoreSchema(findings.schema));
  const rendering = Math.round(scoreRendering(findings.rendering));
  const crawler_access = Math.round(scoreCrawlerAccess(findings.crawler_access));
  const accessibility = Math.round(scoreAccessibility(findings.accessibility));
  const extractability = Math.round(scoreExtractability(findings.content_extractability));

  const category_scores: Scorecard["category_scores"] = {
    schema,
    rendering,
    crawler_access,
    accessibility,
    extractability,
  };

  let total_score = schema + rendering + crawler_access + accessibility + extractability;
  let total_score_max = BASE_SCORE_MAX;

  if (probe) {
    const ai_visibility = Math.round(scoreAiVisibility(probe));
    category_scores.ai_visibility = ai_visibility;
    total_score += ai_visibility;
    total_score_max += AI_VISIBILITY_MAX;
  }

  return {
    url: findings.url,
    total_score,
    total_score_max,
    category_scores,
    top_fixes: computeTopFixes(findings),
    scan_confidence: findings.scan_confidence,
    raw_findings: findings,
    ...(probe ? { raw_probe: probe } : {}),
  };
}

export * from "./rubric/schema.js";
export * from "./rubric/rendering.js";
export * from "./rubric/crawlerAccess.js";
export * from "./rubric/accessibility.js";
export * from "./rubric/extractability.js";
export * from "./rubric/aiVisibility.js";
export * from "./rubric/fixCatalog.js";
export * from "./rubric/topFixes.js";
export * from "./rubric/potential.js";
export * from "./impact/estimateImpact.js";
