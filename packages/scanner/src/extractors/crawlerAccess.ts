import type { BotRuleStatus, CrawlerAccessFindings } from "@aiv/contracts";
import { TRACKED_BOTS } from "@aiv/contracts";

interface RobotsRule {
  type: "allow" | "disallow";
  path: string;
}

interface RobotsBlock {
  agents: string[]; // lowercased
  rules: RobotsRule[];
}

const FETCH_TIMEOUT_MS = 8000;

interface FetchResult {
  ok: boolean;
  status: number;
  text: string | null;
  /** true only for network-level failures (DNS, TLS, timeout) — never for a real HTTP response. */
  errored: boolean;
}

export async function fetchTextWithTimeout(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<FetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: "follow" });
    const text = res.ok ? await res.text() : null;
    return { ok: res.ok, status: res.status, text, errored: false };
  } catch {
    return { ok: false, status: 0, text: null, errored: true };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Parses robots.txt into User-agent groups. Tolerant of malformed input —
 * never throws. Per the robots.txt convention, consecutive "User-agent:"
 * lines share one rule set; a "User-agent:" line seen *after* a rule line
 * starts a brand new group.
 */
export function parseRobotsTxt(raw: string): RobotsBlock[] {
  const blocks: RobotsBlock[] = [];
  let currentAgents: string[] = [];
  let currentRules: RobotsRule[] = [];
  let collectingAgents = true;

  const flush = () => {
    if (currentAgents.length > 0) {
      blocks.push({ agents: currentAgents, rules: currentRules });
    }
  };

  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.split("#")[0]?.trim() ?? "";
    if (!line) continue;
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim().toLowerCase();
    const value = line.slice(colonIdx + 1).trim();

    if (key === "user-agent") {
      if (!collectingAgents) {
        flush();
        currentAgents = [];
        currentRules = [];
        collectingAgents = true;
      }
      currentAgents.push(value.toLowerCase());
    } else if (key === "allow" || key === "disallow") {
      if (currentAgents.length === 0) continue;
      collectingAgents = false;
      currentRules.push({ type: key, path: value });
    }
  }
  flush();
  return blocks;
}

function statusFromRules(rules: RobotsRule[]): BotRuleStatus {
  if (rules.length === 0) return "allowed";
  const blocksRoot = rules.some((r) => r.type === "disallow" && (r.path === "/" || r.path === ""));
  if (blocksRoot) {
    // A later, more specific Allow for "/" would override — treat literal "Allow: /" as re-permit.
    const explicitRootAllow = rules.some((r) => r.type === "allow" && r.path === "/");
    return explicitRootAllow ? "allowed" : "disallowed";
  }
  return "allowed";
}

export function resolveBotStatus(blocks: RobotsBlock[], botName: string): BotRuleStatus {
  const lower = botName.toLowerCase();
  const specific = blocks.find((b) => b.agents.includes(lower));
  if (specific) return statusFromRules(specific.rules);

  const wildcard = blocks.find((b) => b.agents.includes("*"));
  if (wildcard) return statusFromRules(wildcard.rules);

  return "unspecified";
}

export async function extractCrawlerAccess(
  baseUrl: string,
  issues: string[],
): Promise<CrawlerAccessFindings> {
  const origin = new URL(baseUrl).origin;

  const robots = await fetchTextWithTimeout(`${origin}/robots.txt`);
  const llms = await fetchTextWithTimeout(`${origin}/llms.txt`);

  const robots_txt_found = robots.ok && robots.text !== null;
  const llms_txt_found = llms.ok && llms.text !== null;

  let blocks: RobotsBlock[] = [];
  if (robots_txt_found && robots.text) {
    blocks = parseRobotsTxt(robots.text);
  } else if (robots.errored) {
    // Network-level failure (DNS/TLS/timeout) is not the same finding as "no
    // robots.txt" — a confirmed 404 means "unrestricted," a failed fetch
    // means "unknown." Surfacing this keeps crawler_access from silently
    // looking identical to a legitimately open site.
    issues.push("robots.txt fetch failed (network error or timeout) — crawler access results may be incomplete");
  } else if (!robots.ok && robots.status !== 404) {
    issues.push(`robots.txt fetch returned unexpected status ${robots.status}`);
  }

  if (llms.errored) {
    issues.push("llms.txt fetch failed (network error or timeout)");
  }

  const bot_rules: Record<string, BotRuleStatus> = {};
  for (const bot of TRACKED_BOTS) {
    bot_rules[bot] = robots_txt_found ? resolveBotStatus(blocks, bot) : "unspecified";
  }

  return { robots_txt_found, llms_txt_found, bot_rules };
}
