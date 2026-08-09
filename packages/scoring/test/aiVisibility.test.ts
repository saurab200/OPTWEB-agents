import { describe, expect, it } from "vitest";
import type { ProbeResult } from "@aiv/contracts";
import { AI_VISIBILITY_MAX, scoreAiVisibility } from "../src/rubric/aiVisibility.js";

function probe(overall_mention_rate: number): ProbeResult {
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

describe("scoreAiVisibility", () => {
  it("gives full marks at a 100% mention rate", () => {
    expect(scoreAiVisibility(probe(1))).toBe(AI_VISIBILITY_MAX);
  });

  it("gives zero marks when never mentioned", () => {
    expect(scoreAiVisibility(probe(0))).toBe(0);
  });

  it("is directly proportional to mention rate", () => {
    expect(scoreAiVisibility(probe(0.5))).toBeCloseTo(AI_VISIBILITY_MAX * 0.5, 5);
  });

  it("clamps defensively rather than going out of the 0-1 range", () => {
    expect(scoreAiVisibility(probe(1.5))).toBe(AI_VISIBILITY_MAX);
    expect(scoreAiVisibility(probe(-0.2))).toBe(0);
  });
});
