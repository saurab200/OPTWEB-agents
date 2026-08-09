import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { scan } from "@aiv/scanner";
import {
  score,
  projectPotentialScorecard,
  estimateImpact,
  DEFAULT_IMPACT_ASSUMPTIONS,
  SCHEMA_MAX,
  RENDERING_MAX,
  CRAWLER_ACCESS_MAX,
  ACCESSIBILITY_MAX,
  EXTRACTABILITY_MAX,
} from "@aiv/scoring";
import { buildStandaloneHtml, buildReportBody, type HistoryPoint } from "./reportTemplate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const historyDir = path.join(__dirname, "..", "history");
const reportsDir = path.join(__dirname, "..", "reports");

const url = process.argv[2];
if (!url) {
  console.error("Usage: npm run audit -- <url> [--referrals N] [--conversion 0.03] [--value 40] [--years 3]");
  console.error("Example: npm run audit -- https://franklinbbq.com/");
  process.exit(1);
}

function flag(name: string, fallback: number): number {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  const v = parseFloat(process.argv[idx + 1]);
  return Number.isFinite(v) ? v : fallback;
}

const assumptions = {
  estimatedMonthlyAiReferrals: flag("referrals", DEFAULT_IMPACT_ASSUMPTIONS.estimatedMonthlyAiReferrals),
  baselineConversionRate: flag("conversion", DEFAULT_IMPACT_ASSUMPTIONS.baselineConversionRate),
  avgCustomerValue: flag("value", DEFAULT_IMPACT_ASSUMPTIONS.avgCustomerValue),
  projectionYears: flag("years", DEFAULT_IMPACT_ASSUMPTIONS.projectionYears),
};

function slugify(rawUrl: string): string {
  let base: string;
  try {
    const u = new URL(rawUrl);
    base = `${u.hostname}${u.pathname}`;
  } catch {
    // scan() already degrades gracefully on an unparseable URL and returns a
    // failure Findings — this must not crash the CLI on the same input.
    base = `invalid-${rawUrl}`;
  }
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "invalid-url";
}

function loadHistory(slug: string): HistoryPoint[] {
  const file = path.join(historyDir, `${slug}.json`);
  if (!existsSync(file)) return [];
  try {
    return JSON.parse(readFileSync(file, "utf-8"));
  } catch {
    return [];
  }
}

function appendHistory(slug: string, point: HistoryPoint): HistoryPoint[] {
  const history = [...loadHistory(slug), point];
  mkdirSync(historyDir, { recursive: true });
  writeFileSync(path.join(historyDir, `${slug}.json`), JSON.stringify(history, null, 2));
  return history;
}

function bar(pct: number, width = 20): string {
  const filled = Math.round((pct / 100) * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

async function main(): Promise<void> {
  console.log(`\nScanning ${url} ...\n`);
  const findings = await scan(url);
  const current = score(findings);
  const potential = projectPotentialScorecard(findings);
  const impact = estimateImpact(current, potential, assumptions);

  const slug = slugify(findings.url);
  const history = appendHistory(slug, { timestamp: findings.scanned_at, total_score: current.total_score });

  console.log(`AI Visibility Score: ${current.total_score}/100  (potential: ${potential.total_score}/100, scan confidence: ${current.scan_confidence})\n`);

  const maxes: Record<string, number> = {
    schema: SCHEMA_MAX,
    rendering: RENDERING_MAX,
    crawler_access: CRAWLER_ACCESS_MAX,
    accessibility: ACCESSIBILITY_MAX,
    extractability: EXTRACTABILITY_MAX,
  };
  for (const [category, value] of Object.entries(current.category_scores)) {
    const max = maxes[category];
    console.log(`  ${category.padEnd(16)} ${String(value).padStart(2)}/${max}  ${bar((value / max) * 100)}`);
  }

  console.log("\nTop fixes:");
  if (current.top_fixes.length === 0) {
    console.log("  (none — this page is already scoring well)");
  } else {
    for (const fix of current.top_fixes) {
      console.log(`  [+${fix.points_recoverable} pts, ease ${fix.ease}/3] (${fix.category}) ${fix.description}`);
    }
  }

  console.log(`\nEstimated wasted potential: $${Math.round(impact.wastedMonthlyValue).toLocaleString()}/mo, $${Math.round(impact.wastedAnnualValue).toLocaleString()}/yr (illustrative — see report for assumptions)`);

  mkdirSync(reportsDir, { recursive: true });
  const reportData = { url, findings, current, potential, impact, history };
  const timestamp = findings.scanned_at.replace(/[:.]/g, "-");
  const standaloneFile = path.join(reportsDir, `${slug}-${timestamp}.html`);
  const latestFile = path.join(reportsDir, `${slug}-latest.html`);
  const latestFragment = path.join(reportsDir, `${slug}-latest.fragment.html`);

  writeFileSync(standaloneFile, buildStandaloneHtml(reportData));
  writeFileSync(latestFile, buildStandaloneHtml(reportData));
  writeFileSync(latestFragment, buildReportBody(reportData));

  console.log(`\nReport written:`);
  console.log(`  ${latestFile}  (open this in a browser)`);
  console.log(`  ${standaloneFile}  (dated snapshot)`);
  console.log(`\nHistory: ${history.length} scan(s) on record for this URL (integration/history/${slug}.json)\n`);
}

main().catch((err: unknown) => {
  console.error("\nAudit failed:", err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
