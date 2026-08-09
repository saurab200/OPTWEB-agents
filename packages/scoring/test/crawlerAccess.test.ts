import { describe, expect, it } from "vitest";
import type { CrawlerAccessFindings } from "@aiv/contracts";
import { CRAWLER_ACCESS_MAX, scoreCrawlerAccess } from "../src/rubric/crawlerAccess.js";

function findings(bot_rules: CrawlerAccessFindings["bot_rules"]): CrawlerAccessFindings {
  return { robots_txt_found: true, llms_txt_found: false, bot_rules };
}

describe("scoreCrawlerAccess", () => {
  it("gives full marks when no bot is disallowed", () => {
    const f = findings({ GPTBot: "allowed", ClaudeBot: "unspecified" });
    expect(scoreCrawlerAccess(f)).toBe(CRAWLER_ACCESS_MAX);
  });

  it("scales down proportionally per bot blocked", () => {
    // 1 of 4 bots disallowed -> 15 * (3/4)
    const f = findings({
      GPTBot: "disallowed",
      ClaudeBot: "allowed",
      PerplexityBot: "allowed",
      Bingbot: "allowed",
    });
    expect(scoreCrawlerAccess(f)).toBeCloseTo(CRAWLER_ACCESS_MAX * 0.75, 5);
  });

  it("gives near-zero marks (property from spec) when almost every bot is blocked", () => {
    const f = findings({
      GPTBot: "disallowed",
      ClaudeBot: "disallowed",
      PerplexityBot: "disallowed",
      "anthropic-ai": "disallowed",
      Bingbot: "allowed",
    });
    expect(scoreCrawlerAccess(f)).toBeLessThan(CRAWLER_ACCESS_MAX * 0.3);
  });

  it("treats unspecified as not-blocked (robots.txt default-allow semantics)", () => {
    const f = findings({ GPTBot: "unspecified" });
    expect(scoreCrawlerAccess(f)).toBe(CRAWLER_ACCESS_MAX);
  });
});
