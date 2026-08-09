import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { Findings } from "@aiv/contracts";

/**
 * Property-based assertions against the frozen corpus Findings produced by
 * `npm run corpus:run` (packages/scanner/scripts/run_corpus.ts) against the
 * real URLs in fixtures/corpus.json. These are properties, not exact
 * snapshots, since extraction details shift slightly as the scanner hardens.
 *
 * Testing against the saved fixture (rather than re-scanning live on every
 * `npm test`) keeps the suite fast and deterministic; re-run corpus:run and
 * commit the refreshed fixtures whenever an extractor changes meaningfully.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const findingsDir = path.join(__dirname, "..", "fixtures", "corpus_findings");

function load(id: string): Findings {
  return JSON.parse(readFileSync(path.join(findingsDir, `${id}.json`), "utf-8"));
}

describe("corpus: baseline-minimal (example.com)", () => {
  const f = load("baseline-minimal");
  it("has no LocalBusiness/Service/FAQ/Review schema", () => {
    expect(f.schema.local_business.present).toBe(false);
    expect(f.schema.service.present).toBe(false);
    expect(f.schema.faq_page.present).toBe(false);
  });
  it("is not meaningfully JS-dependent", () => {
    expect(f.rendering.js_dependent_content_pct).toBeLessThan(10);
  });
  it("scanned cleanly with high confidence", () => {
    expect(f.scan_confidence).toBe("high");
    expect(f.scan_issues).toHaveLength(0);
  });
});

describe("corpus: content-heavy-ssr (wikipedia)", () => {
  const f = load("content-heavy-ssr");
  it("renders its content without JS", () => {
    expect(f.rendering.js_dependent_content_pct).toBeLessThan(15);
  });
  it("has substantial paragraph content", () => {
    expect(f.content_extractability.avg_paragraph_word_count).toBeGreaterThan(0);
    expect(f.rendering.js_off_word_count).toBeGreaterThan(500);
  });
});

describe("corpus: js-heavy-spa (excalidraw)", () => {
  const f = load("js-heavy-spa");
  it("is highly JS-dependent (property from spec: above 50%)", () => {
    expect(f.rendering.js_dependent_content_pct).toBeGreaterThan(50);
  });
});

describe("corpus: accessibility-reference (w3.org ARIA example)", () => {
  const f = load("accessibility-reference");
  it("has full canonical landmark coverage", () => {
    expect(f.accessibility.landmark_coverage_pct).toBe(100);
  });
  it("has a valid heading hierarchy", () => {
    expect(f.accessibility.heading_hierarchy_valid).toBe(true);
  });
});

describe("corpus: well-optimized-commercial (stripe.com)", () => {
  const f = load("well-optimized-commercial");
  it("does not misclassify Organization schema as LocalBusiness", () => {
    expect(f.schema.local_business.present).toBe(false);
  });
  it("has full landmark coverage and a valid heading hierarchy", () => {
    expect(f.accessibility.landmark_coverage_pct).toBe(100);
    expect(f.accessibility.heading_hierarchy_valid).toBe(true);
  });
});

describe("corpus: partial-local-business-schema (franklinbbq.com)", () => {
  const f = load("partial-local-business-schema");
  it("detects the real LocalBusiness node with partial field completeness", () => {
    expect(f.schema.local_business.present).toBe(true);
    expect(f.schema.local_business.type_found).toBe("LocalBusiness");
    expect(f.schema.local_business.fields_present.length).toBeGreaterThan(0);
    expect(f.schema.local_business.fields_missing.length).toBeGreaterThan(0);
  });
});

describe("corpus: bot-blocking (nytimes.com)", () => {
  const f = load("bot-blocking");
  it("finds a real robots.txt that explicitly disallows major AI crawlers", () => {
    expect(f.crawler_access.robots_txt_found).toBe(true);
    expect(f.crawler_access.bot_rules.GPTBot).toBe("disallowed");
    expect(f.crawler_access.bot_rules.ClaudeBot).toBe("disallowed");
    expect(f.crawler_access.bot_rules["anthropic-ai"]).toBe("disallowed");
  });
});

describe("corpus: broken-unreachable (.invalid domain)", () => {
  const f = load("broken-unreachable");
  it("downgrades to low confidence with logged issues instead of crashing", () => {
    expect(f.scan_confidence).toBe("low");
    expect(f.scan_issues.length).toBeGreaterThan(0);
  });
  it("returns safe defaults rather than fabricated data", () => {
    expect(f.schema.local_business.present).toBe(false);
    expect(f.rendering.js_on_word_count).toBe(0);
  });
});

describe("corpus: login-walled (linkedin.com/feed)", () => {
  const f = load("login-walled");
  it("still returns a well-formed Findings object without crashing", () => {
    expect(f.url).toContain("linkedin.com");
    expect(f.schema.local_business.present).toBe(false);
    expect(typeof f.accessibility.landmark_coverage_pct).toBe("number");
  });
});

describe("corpus: every entry produces a structurally complete Findings object", () => {
  const ids = [
    "baseline-minimal",
    "content-heavy-ssr",
    "js-heavy-spa",
    "accessibility-reference",
    "well-optimized-commercial",
    "partial-local-business-schema",
    "bot-blocking",
    "broken-unreachable",
    "login-walled",
  ];

  it.each(ids)("%s has all required top-level Findings fields", (id) => {
    const f = load(id);
    expect(f.url).toBeTruthy();
    expect(f.scanned_at).toBeTruthy();
    expect(["high", "medium", "low"]).toContain(f.scan_confidence);
    expect(Array.isArray(f.scan_issues)).toBe(true);
    expect(f.schema).toBeDefined();
    expect(f.rendering).toBeDefined();
    expect(f.crawler_access).toBeDefined();
    expect(f.accessibility).toBeDefined();
    expect(f.core_web_vitals).toBeDefined();
    expect(f.content_extractability).toBeDefined();
  });
});
