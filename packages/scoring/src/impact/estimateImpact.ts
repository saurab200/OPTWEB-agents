import type { Scorecard } from "@aiv/contracts";

/**
 * A transparent, parameterized SCENARIO MODEL — not a measurement. There is
 * no reliable public data mapping "AI visibility score" to revenue for an
 * arbitrary business; actual impact depends on this business's real traffic
 * mix, market, and offer. Every assumption below is a labeled, adjustable
 * input so a report reader can see — and override — exactly what's driving
 * the dollar figures, rather than trusting an opaque number. Treat every
 * value this module produces as illustrative, not factual, and say so
 * wherever it's displayed.
 */
export interface ImpactAssumptions {
  /** Estimated monthly instances where an AI assistant could plausibly surface this business
   * (e.g. "best bbq in austin"-style queries). Replace with the business's own estimate. */
  estimatedMonthlyAiReferrals: number;
  /** Fraction of a genuine referral that converts to a real customer action (call/visit/order). */
  baselineConversionRate: number;
  /** Average value of one converted customer action, in the same currency as the output. */
  avgCustomerValue: number;
  /** Years to project the "if nothing changes" cost forward. */
  projectionYears: number;
}

export const DEFAULT_IMPACT_ASSUMPTIONS: ImpactAssumptions = {
  estimatedMonthlyAiReferrals: 500,
  baselineConversionRate: 0.03,
  avgCustomerValue: 40,
  projectionYears: 3,
};

export interface ImpactEstimate {
  assumptions: ImpactAssumptions;
  currentScore: number;
  potentialScore: number;
  currentCaptureRate: number; // 0-1
  potentialCaptureRate: number; // 0-1
  currentMonthlyValue: number;
  potentialMonthlyValue: number;
  wastedMonthlyValue: number;
  wastedAnnualValue: number;
  wastedProjectedValue: number; // over assumptions.projectionYears if unfixed
}

/**
 * Model: capture rate is assumed proportional to AI-visibility score
 * (score/100). This is the single biggest simplifying assumption in this
 * tool — it treats "percent of rubric points earned" as a stand-in for
 * "percent of AI-referable demand actually captured." It is a reasonable
 * starting scenario, not a validated conversion model. Swap in the
 * business's real referral volume, conversion rate, and customer value
 * before presenting these figures as fact.
 */
export function estimateImpact(
  current: Scorecard,
  potential: Scorecard,
  assumptions: ImpactAssumptions = DEFAULT_IMPACT_ASSUMPTIONS,
): ImpactEstimate {
  const currentCaptureRate = current.total_score / 100;
  const potentialCaptureRate = potential.total_score / 100;

  const totalMonthlyOpportunity =
    assumptions.estimatedMonthlyAiReferrals * assumptions.baselineConversionRate * assumptions.avgCustomerValue;

  const currentMonthlyValue = totalMonthlyOpportunity * currentCaptureRate;
  const potentialMonthlyValue = totalMonthlyOpportunity * potentialCaptureRate;
  const wastedMonthlyValue = potentialMonthlyValue - currentMonthlyValue;

  return {
    assumptions,
    currentScore: current.total_score,
    potentialScore: potential.total_score,
    currentCaptureRate,
    potentialCaptureRate,
    currentMonthlyValue,
    potentialMonthlyValue,
    wastedMonthlyValue,
    wastedAnnualValue: wastedMonthlyValue * 12,
    wastedProjectedValue: wastedMonthlyValue * 12 * assumptions.projectionYears,
  };
}
