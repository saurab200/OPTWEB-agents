import type { Findings, Scorecard } from "@aiv/contracts";
import { scoreSchema } from "./rubric/schema.js";
import { scoreRendering } from "./rubric/rendering.js";
import { scoreCrawlerAccess } from "./rubric/crawlerAccess.js";
import { scoreAccessibility } from "./rubric/accessibility.js";
import { scoreExtractability } from "./rubric/extractability.js";
import { computeTopFixes } from "./rubric/topFixes.js";

/**
 * Pure deterministic rules applied to a Findings object. Zero LLM calls, zero
 * judgment at call time — every judgment call this rubric required was made
 * once, at implementation time, and is documented inline in rubric/*.ts and
 * in the README. Same Findings in, same Scorecard out, always.
 */
export function score(findings: Findings): Scorecard {
  const schema = Math.round(scoreSchema(findings.schema));
  const rendering = Math.round(scoreRendering(findings.rendering));
  const crawler_access = Math.round(scoreCrawlerAccess(findings.crawler_access));
  const accessibility = Math.round(scoreAccessibility(findings.accessibility));
  const extractability = Math.round(scoreExtractability(findings.content_extractability));

  const category_scores = { schema, rendering, crawler_access, accessibility, extractability };
  const total_score = schema + rendering + crawler_access + accessibility + extractability;

  return {
    url: findings.url,
    total_score,
    category_scores,
    top_fixes: computeTopFixes(findings),
    scan_confidence: findings.scan_confidence,
    raw_findings: findings,
  };
}

export * from "./rubric/schema.js";
export * from "./rubric/rendering.js";
export * from "./rubric/crawlerAccess.js";
export * from "./rubric/accessibility.js";
export * from "./rubric/extractability.js";
export * from "./rubric/fixCatalog.js";
export * from "./rubric/topFixes.js";
export * from "./rubric/potential.js";
export * from "./impact/estimateImpact.js";
