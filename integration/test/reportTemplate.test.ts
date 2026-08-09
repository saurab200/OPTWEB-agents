import { describe, expect, it } from "vitest";
import type { Findings, ProbeResult, Scorecard } from "@aiv/contracts";
import { buildReportBody, type ReportData } from "../scripts/reportTemplate.js";

function makeFindings(): Findings {
  return {
    url: "https://example.com/",
    scanned_at: new Date().toISOString(),
    schema: {
      local_business: { present: false, type_found: null, fields_present: [], fields_missing: [] },
      service: { present: false, fields_present: [], fields_missing: [] },
      faq_page: { present: false, question_count: 0 },
      review_aggregate: { present: false, fields_present: [], fields_missing: [] },
    },
    rendering: { js_dependent_content_pct: 0, js_on_word_count: 100, js_off_word_count: 100 },
    crawler_access: { robots_txt_found: false, llms_txt_found: false, bot_rules: {} },
    accessibility: {
      landmark_coverage_pct: 100,
      labeled_interactive_pct: 100,
      heading_hierarchy_valid: true,
      h1_count: 1,
    },
    core_web_vitals: { lcp_ms: null, cls: null, inp_ms: null },
    content_extractability: {
      avg_paragraph_word_count: 20,
      qa_formatted_blocks: 0,
      key_facts_in_plain_text: { hours: false, address: false, phone: false, services: false },
    },
    scan_confidence: "high",
    scan_issues: [],
  };
}

function makeScorecard(findings: Findings, overrides: Partial<Scorecard> = {}): Scorecard {
  return {
    url: findings.url,
    total_score: 60,
    total_score_max: 100,
    category_scores: { schema: 10, rendering: 25, crawler_access: 15, accessibility: 8, extractability: 2 },
    top_fixes: [],
    scan_confidence: findings.scan_confidence,
    raw_findings: findings,
    ...overrides,
  };
}

function makeProbe(): ProbeResult {
  return {
    business: { name: "Franklin Barbecue", category: "BBQ restaurant", city: "Austin" },
    probed_at: new Date().toISOString(),
    attempts: [
      {
        provider: "anthropic",
        model: "anthropic/claude-3-haiku",
        query: "best BBQ in Austin?",
        mentioned: true,
        mention_position: 1,
        competitors_mentioned: ["La Barbecue"],
        response_excerpt: "Franklin Barbecue is great.",
        error: null,
      },
    ],
    provider_summaries: [
      { provider: "anthropic", queries_run: 1, times_mentioned: 1, mention_rate: 1, avg_mention_position: 1 },
      { provider: "openai", queries_run: 1, times_mentioned: 0, mention_rate: 0, avg_mention_position: null },
      { provider: "google", queries_run: 1, times_mentioned: 0, mention_rate: 0, avg_mention_position: null },
      { provider: "perplexity", queries_run: 1, times_mentioned: 0, mention_rate: 0, avg_mention_position: null },
    ],
    overall_mention_rate: 0.25,
    probe_confidence: "medium",
    probe_issues: ["openai (openai/gpt-4o-mini) failed: rate limited"],
  };
}

function makeImpact() {
  return {
    assumptions: { estimatedMonthlyAiReferrals: 500, baselineConversionRate: 0.03, avgCustomerValue: 40, projectionYears: 3 },
    currentScore: 60,
    potentialScore: 100,
    currentCaptureRate: 0.6,
    potentialCaptureRate: 1,
    currentMonthlyValue: 360,
    potentialMonthlyValue: 600,
    wastedMonthlyValue: 240,
    wastedAnnualValue: 2880,
    wastedProjectedValue: 8640,
  };
}

describe("buildReportBody: score ring math (regression for the /100-hardcoded bug)", () => {
  it("computes the correct stroke-dashoffset for a 100-max scorecard (no probe)", () => {
    const findings = makeFindings();
    const current = makeScorecard(findings, { total_score: 60, total_score_max: 100 });
    const potential = makeScorecard(findings, { total_score: 100, total_score_max: 100 });
    const html = buildReportBody({
      url: findings.url,
      findings,
      current,
      potential,
      impact: makeImpact(),
      history: [],
    } as ReportData);

    const r = 54;
    const circumference = 2 * Math.PI * r;
    const expectedOffset = circumference * (1 - 60 / 100);
    expect(html).toContain(`stroke-dashoffset:${expectedOffset}`);
    expect(html).toContain(">60<");
    expect(html).toContain("/100");
  });

  it("computes the correct stroke-dashoffset for a 120-max scorecard (with probe) — this exact case was wrong before the fix", () => {
    const findings = makeFindings();
    const current = makeScorecard(findings, {
      total_score: 60,
      total_score_max: 120,
      category_scores: {
        schema: 10,
        rendering: 25,
        crawler_access: 15,
        accessibility: 8,
        extractability: 2,
        ai_visibility: 0,
      },
      raw_probe: makeProbe(),
    });
    const potential = makeScorecard(findings, { total_score: 100, total_score_max: 100 });
    const html = buildReportBody({
      url: findings.url,
      findings,
      current,
      potential,
      impact: makeImpact(),
      history: [],
    } as ReportData);

    const r = 54;
    const circumference = 2 * Math.PI * r;
    // The bug: dividing by a hardcoded 100 here would give 0.4*circumference
    // (visually 60%) instead of the correct 0.5*circumference (60/120=50%).
    const correctOffset = circumference * (1 - 60 / 120);
    const buggyOffset = circumference * (1 - 60 / 100);
    expect(html).toContain(`stroke-dashoffset:${correctOffset}`);
    expect(html).not.toContain(`stroke-dashoffset:${buggyOffset}`);
  });
});

describe("buildReportBody: conditional AI-visibility rendering", () => {
  it("omits the AI-visibility row and probe section when no probe was run", () => {
    const findings = makeFindings();
    const current = makeScorecard(findings);
    const potential = makeScorecard(findings, { total_score: 100 });
    const html = buildReportBody({
      url: findings.url,
      findings,
      current,
      potential,
      impact: makeImpact(),
      history: [],
    } as ReportData);
    expect(html).not.toContain("AI visibility — real probe results");
    expect(html).not.toContain("AI visibility (real probe)");
  });

  it("renders the AI-visibility row and per-provider probe table when a probe is present", () => {
    const findings = makeFindings();
    const probe = makeProbe();
    const current = makeScorecard(findings, {
      total_score: 60,
      total_score_max: 120,
      category_scores: {
        schema: 10,
        rendering: 25,
        crawler_access: 15,
        accessibility: 8,
        extractability: 2,
        ai_visibility: 5,
      },
      raw_probe: probe,
    });
    const potential = makeScorecard(findings, { total_score: 100 });
    const html = buildReportBody({
      url: findings.url,
      findings,
      current,
      potential,
      impact: makeImpact(),
      history: [],
    } as ReportData);
    expect(html).toContain("AI visibility — real probe results");
    expect(html).toContain("AI visibility (real probe)");
    expect(html).toContain("Franklin Barbecue");
    expect(html).toContain("La Barbecue"); // competitor mentioned
    expect(html).toContain("call(s) failed");
  });
});
