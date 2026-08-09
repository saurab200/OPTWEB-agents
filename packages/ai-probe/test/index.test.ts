import { describe, expect, it, vi, beforeEach } from "vitest";

const generateObjectMock = vi.fn();
vi.mock("ai", () => ({
  generateObject: (...args: unknown[]) => generateObjectMock(...args),
}));

const { probe } = await import("../src/index.js");

const business = { name: "Franklin Barbecue", category: "BBQ restaurant", city: "Austin" };

beforeEach(() => {
  generateObjectMock.mockReset();
});

describe("probe: guardrail behavior (mocked network, mirrors Scanner's scan() contract)", () => {
  it("never throws even when every provider call fails", async () => {
    generateObjectMock.mockRejectedValue(new Error("simulated provider outage"));
    await expect(probe(business)).resolves.toBeDefined();
  });

  it("returns a well-formed ProbeResult with all 16 attempts (4 providers x 4 queries) when everything fails", async () => {
    generateObjectMock.mockRejectedValue(new Error("simulated provider outage"));
    const result = await probe(business);
    expect(result.attempts).toHaveLength(16);
    expect(result.attempts.every((a) => a.error !== null)).toBe(true);
    expect(result.overall_mention_rate).toBe(0);
    expect(result.probe_confidence).toBe("low");
    expect(result.probe_issues.length).toBeGreaterThan(0);
  });

  it("degrades to medium confidence when roughly half the attempts fail", async () => {
    let call = 0;
    generateObjectMock.mockImplementation(async () => {
      call++;
      if (call % 2 === 0) throw new Error("simulated rate limit");
      return { object: { answer: "Try Franklin Barbecue!", mentioned_businesses: ["Franklin Barbecue"] } };
    });
    const result = await probe(business);
    expect(result.probe_confidence).toBe("medium");
  });

  it("reports high confidence and correct mention data when every call succeeds", async () => {
    generateObjectMock.mockResolvedValue({
      object: { answer: "Try Franklin Barbecue, it's the best!", mentioned_businesses: ["Franklin Barbecue"] },
    });
    const result = await probe(business);
    expect(result.probe_confidence).toBe("high");
    expect(result.probe_issues).toHaveLength(0);
    expect(result.overall_mention_rate).toBe(1);
    expect(result.attempts.every((a) => a.mentioned)).toBe(true);
  });

  it("computes accurate per-provider summaries", async () => {
    generateObjectMock.mockResolvedValue({
      object: { answer: "Not sure, try La Barbecue.", mentioned_businesses: ["La Barbecue"] },
    });
    const result = await probe(business);
    for (const summary of result.provider_summaries) {
      expect(summary.queries_run).toBe(4);
      expect(summary.times_mentioned).toBe(0);
      expect(summary.mention_rate).toBe(0);
      expect(summary.avg_mention_position).toBeNull();
    }
  });

  it("respects a model override via options.models", async () => {
    generateObjectMock.mockResolvedValue({
      object: { answer: "Franklin Barbecue!", mentioned_businesses: ["Franklin Barbecue"] },
    });
    const result = await probe(business, { models: { anthropic: "anthropic/claude-opus-4.6" } });
    const anthropicAttempts = result.attempts.filter((a) => a.provider === "anthropic");
    expect(anthropicAttempts.every((a) => a.model === "anthropic/claude-opus-4.6")).toBe(true);
  });

  it("truncates response_excerpt rather than storing unbounded text", async () => {
    generateObjectMock.mockResolvedValue({
      object: { answer: "x".repeat(2000), mentioned_businesses: [] },
    });
    const result = await probe(business);
    expect(result.attempts[0].response_excerpt.length).toBeLessThanOrEqual(400);
  });
});
