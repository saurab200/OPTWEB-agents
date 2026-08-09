import type { CrawlerAccessFindings } from "@aiv/contracts";

/**
 * AI crawler access — 15 pts. Full points if no named bot is disallowed;
 * scaled down proportionally per bot blocked. "unspecified" (no explicit
 * rule found) is treated as not-blocked, matching robots.txt semantics
 * (crawlers default to allowed absent a rule).
 */
export const CRAWLER_ACCESS_MAX = 15;

export function scoreCrawlerAccess(crawlerAccess: CrawlerAccessFindings): number {
  const statuses = Object.values(crawlerAccess.bot_rules);
  if (statuses.length === 0) return CRAWLER_ACCESS_MAX;
  const disallowedCount = statuses.filter((s) => s === "disallowed").length;
  return CRAWLER_ACCESS_MAX * (1 - disallowedCount / statuses.length);
}
