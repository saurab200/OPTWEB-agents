import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { Findings } from "@aiv/contracts";
import { score } from "../src/index.js";

/**
 * Property-based assertions against the Scanner Agent's frozen corpus
 * Findings (packages/scoring/fixtures/findings — copied verbatim from
 * packages/scanner/fixtures/corpus_findings, never re-scanned here). This is
 * the integration surface between the two agents: Scoring only ever reads
 * the Findings contract, never Scanner internals.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const findingsDir = path.join(__dirname, "..", "fixtures", "findings");

function load(id: string): Findings {
  return JSON.parse(readFileSync(path.join(findingsDir, `${id}.json`), "utf-8"));
}

const allIds = readdirSync(findingsDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""));

describe("score: determinism", () => {
  it.each(allIds)("%s produces an identical Scorecard across repeated calls", (id) => {
    const findings = load(id);
    const a = score(findings);
    const b = score(findings);
    expect(a).toEqual(b);
  });
});

describe("score: structural guarantees across the full corpus", () => {
  it.each(allIds)("%s: total_score is 0-100 and equals the sum of category scores", (id) => {
    const scorecard = score(load(id));
    expect(scorecard.total_score).toBeGreaterThanOrEqual(0);
    expect(scorecard.total_score).toBeLessThanOrEqual(100);
    const sum = Object.values(scorecard.category_scores).reduce((a, b) => a + b, 0);
    expect(scorecard.total_score).toBe(sum);
  });

  it.each(allIds)("%s: top_fixes has at most 3 items", (id) => {
    const scorecard = score(load(id));
    expect(scorecard.top_fixes.length).toBeLessThanOrEqual(3);
  });

  it.each(allIds)("%s: top_fixes is non-empty whenever total_score is sub-70", (id) => {
    const scorecard = score(load(id));
    if (scorecard.total_score < 70) {
      expect(scorecard.top_fixes.length).toBeGreaterThan(0);
    }
  });

  it.each(allIds)("%s: scan_confidence is passed through unchanged from Findings", (id) => {
    const findings = load(id);
    const scorecard = score(findings);
    expect(scorecard.scan_confidence).toBe(findings.scan_confidence);
  });

  it.each(allIds)("%s: raw_findings is preserved verbatim for traceability", (id) => {
    const findings = load(id);
    const scorecard = score(findings);
    expect(scorecard.raw_findings).toEqual(findings);
  });

  it.each(allIds)("%s: every top_fix has a valid ease in {1,2,3} and positive points_recoverable", (id) => {
    const scorecard = score(load(id));
    for (const fix of scorecard.top_fixes) {
      expect([1, 2, 3]).toContain(fix.ease);
      expect(fix.points_recoverable).toBeGreaterThan(0);
    }
  });
});

describe("score: corpus-specific properties (spec examples)", () => {
  it("the bot-blocking site's crawler_access category score is near zero", () => {
    const scorecard = score(load("bot-blocking"));
    expect(scorecard.category_scores.crawler_access).toBeLessThan(4);
  });

  it("the fully-optimized commercial site scores well above the corpus median on rendering+accessibility", () => {
    const scorecard = score(load("well-optimized-commercial"));
    expect(scorecard.category_scores.rendering).toBeGreaterThan(15);
    expect(scorecard.category_scores.accessibility).toBeGreaterThan(8);
  });

  it("the JS-heavy SPA scores poorly on rendering", () => {
    const scorecard = score(load("js-heavy-spa"));
    expect(scorecard.category_scores.rendering).toBeLessThan(10);
  });

  it("the partial-schema site scores non-zero but non-maximal on schema", () => {
    const scorecard = score(load("partial-local-business-schema"));
    expect(scorecard.category_scores.schema).toBeGreaterThan(0);
    expect(scorecard.category_scores.schema).toBeLessThan(35);
  });

  it("the broken/unreachable site scores at or near the floor on accessibility and extractability", () => {
    const scorecard = score(load("broken-unreachable"));
    expect(scorecard.category_scores.accessibility).toBe(0);
    expect(scorecard.category_scores.extractability).toBe(0);
  });
});

describe("score: category_scores traceability to raw_findings", () => {
  it("schema score is 0 iff no schema type is present in raw_findings", () => {
    for (const id of allIds) {
      const scorecard = score(load(id));
      const s = scorecard.raw_findings.schema;
      const anyPresent =
        s.local_business.present || s.service.present || s.faq_page.present || s.review_aggregate.present;
      if (!anyPresent) {
        expect(scorecard.category_scores.schema).toBe(0);
      } else {
        expect(scorecard.category_scores.schema).toBeGreaterThan(0);
      }
    }
  });

  it("rendering score of 25 (max, post-rounding) implies raw_findings.rendering.js_dependent_content_pct is near 0", () => {
    // 25 * (1 - pct/100) rounds to 25 for any pct < 2, not just pct === 0 —
    // the rubric's rounding step is intentionally coarse (int category
    // scores), so this checks the traceable range, not exact equality.
    for (const id of allIds) {
      const scorecard = score(load(id));
      if (scorecard.category_scores.rendering === 25) {
        expect(scorecard.raw_findings.rendering.js_dependent_content_pct).toBeLessThan(2);
      }
    }
  });
});
