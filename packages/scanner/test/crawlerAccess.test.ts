import { describe, expect, it } from "vitest";
import { extractCrawlerAccess, fetchTextWithTimeout, parseRobotsTxt, resolveBotStatus } from "../src/extractors/crawlerAccess.js";

const UNREACHABLE_URL = "https://this-domain-does-not-exist-aiv-corpus-test.invalid/";

describe("parseRobotsTxt + resolveBotStatus", () => {
  it("matches the real nytimes.com pattern: explicit bot-specific Disallow: /", () => {
    const raw = `
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Bingbot
Disallow: /vi/
`;
    const blocks = parseRobotsTxt(raw);
    expect(resolveBotStatus(blocks, "GPTBot")).toBe("disallowed");
    expect(resolveBotStatus(blocks, "ClaudeBot")).toBe("disallowed");
    // Bingbot only has a specific-path disallow, not root — should not read as fully blocked.
    expect(resolveBotStatus(blocks, "Bingbot")).toBe("allowed");
    // Never mentioned anywhere, no wildcard block present -> unspecified.
    expect(resolveBotStatus(blocks, "PerplexityBot")).toBe("unspecified");
  });

  it("falls back to the wildcard '*' block when a bot isn't named specifically", () => {
    const raw = `
User-agent: *
Disallow: /
`;
    const blocks = parseRobotsTxt(raw);
    expect(resolveBotStatus(blocks, "GPTBot")).toBe("disallowed");
  });

  it("treats a bot with no matching block and no wildcard as unspecified", () => {
    const blocks = parseRobotsTxt("");
    expect(resolveBotStatus(blocks, "GPTBot")).toBe("unspecified");
  });

  it("treats an explicit 'Allow: /' as re-permitting a bot after 'Disallow: /'", () => {
    const raw = `
User-agent: GPTBot
Disallow: /
Allow: /
`;
    const blocks = parseRobotsTxt(raw);
    expect(resolveBotStatus(blocks, "GPTBot")).toBe("allowed");
  });

  it("is case-insensitive on bot names", () => {
    const raw = `User-agent: gptbot\nDisallow: /`;
    const blocks = parseRobotsTxt(raw);
    expect(resolveBotStatus(blocks, "GPTBot")).toBe("disallowed");
  });

  it("never throws on malformed robots.txt content", () => {
    const raw = "this is not\na valid robots file\nat all: : :";
    expect(() => parseRobotsTxt(raw)).not.toThrow();
  });

  it("groups multiple consecutive User-agent lines sharing one rule set", () => {
    const raw = `
User-agent: GPTBot
User-agent: ClaudeBot
Disallow: /
`;
    const blocks = parseRobotsTxt(raw);
    expect(resolveBotStatus(blocks, "GPTBot")).toBe("disallowed");
    expect(resolveBotStatus(blocks, "ClaudeBot")).toBe("disallowed");
  });
});

describe("fetchTextWithTimeout: distinguishing network failure from a real HTTP response", () => {
  it("marks a DNS/network failure as errored:true, not just ok:false", async () => {
    const result = await fetchTextWithTimeout(`${UNREACHABLE_URL}robots.txt`, 5000);
    expect(result.ok).toBe(false);
    expect(result.errored).toBe(true);
    expect(result.text).toBeNull();
  });
});

describe("extractCrawlerAccess: network failure vs confirmed absence", () => {
  it("surfaces a scan_issues entry when robots.txt fetch fails at the network level (regression: previously silent, identical to a legitimate 404)", async () => {
    const issues: string[] = [];
    const result = await extractCrawlerAccess(UNREACHABLE_URL, issues);
    expect(result.robots_txt_found).toBe(false);
    expect(issues.some((i) => i.includes("robots.txt fetch failed"))).toBe(true);
  });
});
