import { describe, expect, it, vi, beforeEach } from "vitest";

const generateObjectMock = vi.fn();
vi.mock("ai", () => ({
  generateObject: (...args: unknown[]) => generateObjectMock(...args),
}));

const { probe } = await import("../src/index.js");

const business = { name: "Franklin Barbecue", category: "BBQ restaurant", city: "Austin" };

// pacingMs:0 keeps this suite fast (mocked network has no real quota to
// protect) — production default pacing is covered by concurrency.test.ts's
// unit tests plus the dedicated pass-through test below.
const FAST = { pacingMs: 0 };

beforeEach(() => {
  generateObjectMock.mockReset();
});

describe("probe: guardrail behavior (mocked network, mirrors Scanner's scan() contract)", () => {
  it("never throws even when every provider call fails", async () => {
    generateObjectMock.mockRejectedValue(new Error("simulated provider outage"));
    await expect(probe(business, FAST)).resolves.toBeDefined();
  });

  it("returns a well-formed ProbeResult with all 16 attempts (4 providers x 4 queries) when everything fails", async () => {
    generateObjectMock.mockRejectedValue(new Error("simulated provider outage"));
    const result = await probe(business, FAST);
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
    const result = await probe(business, FAST);
    expect(result.probe_confidence).toBe("medium");
  });

  it("reports high confidence and correct mention data when every call succeeds", async () => {
    generateObjectMock.mockResolvedValue({
      object: { answer: "Try Franklin Barbecue, it's the best!", mentioned_businesses: ["Franklin Barbecue"] },
    });
    const result = await probe(business, FAST);
    expect(result.probe_confidence).toBe("high");
    expect(result.probe_issues).toHaveLength(0);
    expect(result.overall_mention_rate).toBe(1);
    expect(result.attempts.every((a) => a.mentioned)).toBe(true);
  });

  it("computes accurate per-provider summaries", async () => {
    generateObjectMock.mockResolvedValue({
      object: { answer: "Not sure, try La Barbecue.", mentioned_businesses: ["La Barbecue"] },
    });
    const result = await probe(business, FAST);
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
    const result = await probe(business, { ...FAST, models: { anthropic: "anthropic/claude-opus-4.6" } });
    const anthropicAttempts = result.attempts.filter((a) => a.provider === "anthropic");
    expect(anthropicAttempts.every((a) => a.model === "anthropic/claude-opus-4.6")).toBe(true);
  });

  it("requests gateway caching by default, to avoid re-spending credit on repeated identical probes", async () => {
    generateObjectMock.mockResolvedValue({
      object: { answer: "Franklin Barbecue!", mentioned_businesses: ["Franklin Barbecue"] },
    });
    await probe(business, FAST);
    const callArgs = generateObjectMock.mock.calls[0][0];
    expect(callArgs.providerOptions?.gateway?.cacheControl).toBe("max-age=86400");
  });

  it("respects a custom cacheTtlSeconds", async () => {
    generateObjectMock.mockResolvedValue({
      object: { answer: "Franklin Barbecue!", mentioned_businesses: ["Franklin Barbecue"] },
    });
    await probe(business, { ...FAST, cacheTtlSeconds: 60 });
    const callArgs = generateObjectMock.mock.calls[0][0];
    expect(callArgs.providerOptions?.gateway?.cacheControl).toBe("max-age=60");
  });

  it("omits cacheControl entirely when cacheTtlSeconds is 0 (force-fresh mode)", async () => {
    generateObjectMock.mockResolvedValue({
      object: { answer: "Franklin Barbecue!", mentioned_businesses: ["Franklin Barbecue"] },
    });
    await probe(business, { ...FAST, cacheTtlSeconds: 0 });
    const callArgs = generateObjectMock.mock.calls[0][0];
    expect(callArgs.providerOptions).toBeUndefined();
  });

  it("truncates response_excerpt rather than storing unbounded text", async () => {
    generateObjectMock.mockResolvedValue({
      object: { answer: "x".repeat(2000), mentioned_businesses: [] },
    });
    const result = await probe(business, FAST);
    expect(result.attempts[0].response_excerpt.length).toBeLessThanOrEqual(400);
  });

  it("paces requests by pacingMs when a nonzero value is given (default is REQUEST_PACING_MS in production)", async () => {
    generateObjectMock.mockResolvedValue({
      object: { answer: "Franklin Barbecue!", mentioned_businesses: ["Franklin Barbecue"] },
    });
    const t0 = Date.now();
    await probe(business, { pacingMs: 15 });
    // 16 attempts / 3 concurrent workers means each worker paces multiple
    // requests; even a small pacingMs must add measurable wall-clock time
    // versus the FAST (pacingMs:0) path used by every other test above.
    expect(Date.now() - t0).toBeGreaterThan(15);
  });
});
