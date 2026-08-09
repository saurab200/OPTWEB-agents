import { describe, expect, it } from "vitest";
import type { Scorecard } from "@aiv/contracts";
import { DEFAULT_IMPACT_ASSUMPTIONS, estimateImpact } from "../src/impact/estimateImpact.js";

function scorecard(total_score: number): Scorecard {
  return {
    url: "https://example.com/",
    total_score,
    category_scores: { schema: 0, rendering: 0, crawler_access: 0, accessibility: 0, extractability: 0 },
    top_fixes: [],
    scan_confidence: "high",
    raw_findings: {} as Scorecard["raw_findings"],
  };
}

describe("estimateImpact", () => {
  it("is 0 wasted value when current and potential scores are equal", () => {
    const est = estimateImpact(scorecard(80), scorecard(80));
    expect(est.wastedMonthlyValue).toBe(0);
    expect(est.wastedAnnualValue).toBe(0);
  });

  it("scales wasted value linearly with the score gap, per the documented model", () => {
    const est = estimateImpact(scorecard(50), scorecard(100));
    const opportunity =
      DEFAULT_IMPACT_ASSUMPTIONS.estimatedMonthlyAiReferrals *
      DEFAULT_IMPACT_ASSUMPTIONS.baselineConversionRate *
      DEFAULT_IMPACT_ASSUMPTIONS.avgCustomerValue;
    expect(est.wastedMonthlyValue).toBeCloseTo(opportunity * 0.5, 5);
  });

  it("annual value is exactly 12x monthly, and projected value is exactly projectionYears x annual", () => {
    const est = estimateImpact(scorecard(40), scorecard(90));
    expect(est.wastedAnnualValue).toBeCloseTo(est.wastedMonthlyValue * 12, 5);
    expect(est.wastedProjectedValue).toBeCloseTo(est.wastedAnnualValue * DEFAULT_IMPACT_ASSUMPTIONS.projectionYears, 5);
  });

  it("respects custom assumptions rather than always using the defaults", () => {
    const est = estimateImpact(scorecard(0), scorecard(100), {
      estimatedMonthlyAiReferrals: 1000,
      baselineConversionRate: 0.1,
      avgCustomerValue: 200,
      projectionYears: 1,
    });
    expect(est.wastedMonthlyValue).toBeCloseTo(1000 * 0.1 * 200, 5);
  });

  it("never produces a negative wasted value when potential >= current (guaranteed by projectPotentialScorecard)", () => {
    const est = estimateImpact(scorecard(70), scorecard(70));
    expect(est.wastedMonthlyValue).toBeGreaterThanOrEqual(0);
  });
});
