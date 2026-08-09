import { chromium } from "playwright";
import type {
  AccessibilityFindings,
  ContentExtractabilityFindings,
  CrawlerAccessFindings,
  Findings,
  ScanConfidence,
} from "@aiv/contracts";
import { TRACKED_BOTS } from "@aiv/contracts";
import { buildSchemaFindings, extractSchemaFindings } from "./extractors/schema.js";
import { extractRenderingFindings } from "./extractors/rendering.js";
import { extractCrawlerAccess } from "./extractors/crawlerAccess.js";
import { extractAccessibilityFindings } from "./extractors/accessibility.js";
import { extractCoreWebVitals } from "./extractors/coreWebVitals.js";
import { extractContentExtractability } from "./extractors/contentExtractability.js";

const PAGE_LOAD_TIMEOUT_MS = 20000;
const MAX_ISSUES_FOR_HIGH_CONFIDENCE = 0;
const MAX_ISSUES_FOR_MEDIUM_CONFIDENCE = 2;

/**
 * scan_confidence is a direct function of how much of the extraction pipeline
 * actually succeeded. A page that never loaded gets "low" unconditionally —
 * everything downstream of it is a default, not a measurement.
 */
export function computeScanConfidence(issues: string[], pageLoaded: boolean): ScanConfidence {
  if (!pageLoaded) return "low";
  if (issues.length > MAX_ISSUES_FOR_MEDIUM_CONFIDENCE) return "low";
  if (issues.length > MAX_ISSUES_FOR_HIGH_CONFIDENCE) return "medium";
  return "high";
}

function emptyAccessibility(): AccessibilityFindings {
  return {
    landmark_coverage_pct: 0,
    labeled_interactive_pct: 0,
    heading_hierarchy_valid: false,
    h1_count: 0,
  };
}

function emptyContentExtractability(): ContentExtractabilityFindings {
  return {
    avg_paragraph_word_count: 0,
    qa_formatted_blocks: 0,
    key_facts_in_plain_text: { hours: false, address: false, phone: false, services: false },
  };
}

function defaultCrawlerAccess(): CrawlerAccessFindings {
  const bot_rules: Record<string, "unspecified"> = {};
  for (const bot of TRACKED_BOTS) bot_rules[bot] = "unspecified";
  return { robots_txt_found: false, llms_txt_found: false, bot_rules };
}

function buildFailureFindings(url: string, scanned_at: string, issues: string[]): Findings {
  return {
    url,
    scanned_at,
    schema: buildSchemaFindings([]),
    rendering: { js_dependent_content_pct: 0, js_on_word_count: 0, js_off_word_count: 0 },
    crawler_access: defaultCrawlerAccess(),
    accessibility: emptyAccessibility(),
    core_web_vitals: { lcp_ms: null, cls: null, inp_ms: null },
    content_extractability: emptyContentExtractability(),
    scan_confidence: "low",
    scan_issues: issues,
  };
}

/**
 * Pure extraction, zero scoring logic. Never throws — any per-field failure
 * is caught, logged into scan_issues, and reflected as a confidence downgrade
 * so the Scoring Agent never has to handle a Scanner crash.
 */
export async function scan(url: string): Promise<Findings> {
  const scanned_at = new Date().toISOString();
  const issues: string[] = [];

  let normalizedUrl: string;
  try {
    normalizedUrl = new URL(url).toString();
  } catch {
    return buildFailureFindings(url, scanned_at, ["Invalid URL: could not be parsed"]);
  }

  const browser = await chromium.launch({ headless: true });
  let pageLoaded = false;

  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(PAGE_LOAD_TIMEOUT_MS);

    try {
      await page.goto(normalizedUrl, { waitUntil: "load" });
      pageLoaded = true;
    } catch (err) {
      issues.push(`Page load failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    const [schema, accessibility, contentExtractability, rendering, crawlerAccess, coreWebVitals] =
      await Promise.all([
        pageLoaded
          ? extractSchemaFindings(page, issues).catch((err: unknown) => {
              issues.push(`Schema extraction crashed: ${String(err)}`);
              return buildSchemaFindings([]);
            })
          : Promise.resolve(buildSchemaFindings([])),
        pageLoaded
          ? extractAccessibilityFindings(page, issues).catch((err: unknown) => {
              issues.push(`Accessibility extraction crashed: ${String(err)}`);
              return emptyAccessibility();
            })
          : Promise.resolve(emptyAccessibility()),
        pageLoaded
          ? extractContentExtractability(page, issues).catch((err: unknown) => {
              issues.push(`Content extractability crashed: ${String(err)}`);
              return emptyContentExtractability();
            })
          : Promise.resolve(emptyContentExtractability()),
        extractRenderingFindings(browser, normalizedUrl, issues).catch((err: unknown) => {
          issues.push(`Rendering extraction crashed: ${String(err)}`);
          return { js_dependent_content_pct: 0, js_on_word_count: 0, js_off_word_count: 0 };
        }),
        extractCrawlerAccess(normalizedUrl, issues).catch((err: unknown) => {
          issues.push(`Crawler access extraction crashed: ${String(err)}`);
          return defaultCrawlerAccess();
        }),
        extractCoreWebVitals(normalizedUrl, issues).catch((err: unknown) => {
          issues.push(`Core Web Vitals extraction crashed: ${String(err)}`);
          return { lcp_ms: null, cls: null, inp_ms: null };
        }),
      ]);

    await context.close();

    return {
      url: normalizedUrl,
      scanned_at,
      schema,
      rendering,
      crawler_access: crawlerAccess,
      accessibility,
      core_web_vitals: coreWebVitals,
      content_extractability: contentExtractability,
      scan_confidence: computeScanConfidence(issues, pageLoaded),
      scan_issues: issues,
    };
  } finally {
    await browser.close();
  }
}

export * from "./extractors/schema.js";
export * from "./extractors/rendering.js";
export * from "./extractors/crawlerAccess.js";
export * from "./extractors/accessibility.js";
export * from "./extractors/coreWebVitals.js";
export * from "./extractors/contentExtractability.js";
