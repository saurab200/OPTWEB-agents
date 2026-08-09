import { describe, expect, it } from "vitest";
import type { AccessibilityFindings } from "@aiv/contracts";
import { ACCESSIBILITY_MAX, HEADING_PENALTY, scoreAccessibility } from "../src/rubric/accessibility.js";

function findings(overrides: Partial<AccessibilityFindings>): AccessibilityFindings {
  return {
    landmark_coverage_pct: 100,
    labeled_interactive_pct: 100,
    heading_hierarchy_valid: true,
    h1_count: 1,
    ...overrides,
  };
}

describe("scoreAccessibility", () => {
  it("gives full marks for perfect landmarks, labels, and heading structure", () => {
    expect(scoreAccessibility(findings({}))).toBe(ACCESSIBILITY_MAX);
  });

  it("is 0 when both percentage signals are 0 (no heading penalty double-counted below the floor)", () => {
    expect(
      scoreAccessibility(findings({ landmark_coverage_pct: 0, labeled_interactive_pct: 0 })),
    ).toBe(0);
  });

  it("applies a single flat penalty when heading_hierarchy_valid is false", () => {
    const withPenalty = scoreAccessibility(findings({ heading_hierarchy_valid: false }));
    expect(withPenalty).toBe(ACCESSIBILITY_MAX - HEADING_PENALTY);
  });

  it("applies the same flat penalty when h1_count != 1 (0 or 2+)", () => {
    expect(scoreAccessibility(findings({ h1_count: 0 }))).toBe(ACCESSIBILITY_MAX - HEADING_PENALTY);
    expect(scoreAccessibility(findings({ h1_count: 2 }))).toBe(ACCESSIBILITY_MAX - HEADING_PENALTY);
  });

  it("does not stack the penalty when both heading conditions are violated at once", () => {
    const both = scoreAccessibility(findings({ heading_hierarchy_valid: false, h1_count: 3 }));
    expect(both).toBe(ACCESSIBILITY_MAX - HEADING_PENALTY);
  });

  it("never goes negative even with a full penalty on a near-zero base", () => {
    const worst = scoreAccessibility(
      findings({ landmark_coverage_pct: 0, labeled_interactive_pct: 0, heading_hierarchy_valid: false, h1_count: 0 }),
    );
    expect(worst).toBe(0);
  });
});
