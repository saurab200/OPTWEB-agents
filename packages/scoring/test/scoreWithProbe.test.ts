import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { Findings, ProbeResult } from "@aiv/contracts";
import { score } from "../src/index.js";
import { AI_VISIBILITY_MAX } from "../src/rubric/aiVisibility.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const findings: Findings = JSON.parse(
  readFileSync(path.join(__dirname, "..", "fixtures", "findings", "partial-local-business-schema.json"), "utf-8"),
);

function makeProbe(overall_mention_rate: number): ProbeResult {
  return {
    business: { name: "Franklin Barbecue", category: "BBQ restaurant", city: "Austin" },
    probed_at: new Date().toISOString(),
    attempts: [],
    provider_summaries: [],
    overall_mention_rate,
    probe_confidence: "high",
    probe_issues: [],
  };
}

describe("score(findings) — no probe: reproduces the original 5-category rubric exactly", () => {
  it("total_score_max is 100 and category_scores has no ai_visibility key", () => {
    const scorecard = score(findings);
    expect(scorecard.total_score_max).toBe(100);
    expect(scorecard.category_scores.ai_visibility).toBeUndefined();
    expect(scorecard.raw_probe).toBeUndefined();
  });
});

describe("score(findings, probe) — additive ai_visibility category", () => {
  it("extends total_score_max to 120 and adds ai_visibility to category_scores", () => {
    const scorecard = score(findings, makeProbe(0.75));
    expect(scorecard.total_score_max).toBe(120);
    expect(scorecard.category_scores.ai_visibility).toBeCloseTo(AI_VISIBILITY_MAX * 0.75, 0);
  });

  it("total_score equals the sum of all present category scores, including ai_visibility", () => {
    const scorecard = score(findings, makeProbe(0.5));
    const sum = Object.values(scorecard.category_scores).reduce((a, b) => a + b, 0);
    expect(scorecard.total_score).toBe(sum);
  });

  it("preserves the base 5-category scores identically to the no-probe call (additive, not a re-weight)", () => {
    const withoutProbe = score(findings);
    const withProbe = score(findings, makeProbe(0.9));
    expect(withProbe.category_scores.schema).toBe(withoutProbe.category_scores.schema);
    expect(withProbe.category_scores.rendering).toBe(withoutProbe.category_scores.rendering);
    expect(withProbe.category_scores.crawler_access).toBe(withoutProbe.category_scores.crawler_access);
    expect(withProbe.category_scores.accessibility).toBe(withoutProbe.category_scores.accessibility);
    expect(withProbe.category_scores.extractability).toBe(withoutProbe.category_scores.extractability);
  });

  it("sets raw_probe to the exact input for traceability", () => {
    const p = makeProbe(0.4);
    const scorecard = score(findings, p);
    expect(scorecard.raw_probe).toEqual(p);
  });

  it("is deterministic: same findings + probe in, same Scorecard out", () => {
    const p = makeProbe(0.6);
    expect(score(findings, p)).toEqual(score(findings, p));
  });
});
