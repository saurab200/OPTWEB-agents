import * as chromeLauncher from "chrome-launcher";
import type { CoreWebVitalsFindings } from "@aiv/contracts";

const LIGHTHOUSE_TIMEOUT_MS = 45000;

/**
 * Lighthouse audit IDs for Core Web Vitals. INP is intentionally left null:
 * Lighthouse navigation-mode runs are lab-only, single-page-load audits with
 * no real user interaction to sample, so INP (an interaction metric) cannot
 * be honestly measured here — returning a fabricated number would violate
 * the "never silently return a confidently-wrong Findings object" guardrail.
 * This is a documented judgment call, not an oversight.
 */
export async function extractCoreWebVitals(
  url: string,
  issues: string[],
): Promise<CoreWebVitalsFindings> {
  let chrome: chromeLauncher.LaunchedChrome | undefined;
  try {
    // Deliberately does NOT pass --no-sandbox: this tool's entire job is to
    // render adversarial, attacker-controlled pages, which is exactly the
    // scenario Chrome's OS-level sandbox exists to contain. If this ever
    // needs to run as root or inside a container without user-namespace
    // support, re-adding --no-sandbox should be a deliberate, documented
    // choice paired with running the scan in an isolated environment with
    // no access to secrets or the internal network — not a default flag.
    chrome = await chromeLauncher.launch({
      chromeFlags: ["--headless=new", "--disable-gpu"],
    });

    const lighthouseModule = await import("lighthouse");
    const lighthouse = lighthouseModule.default;

    const runnerResult = await Promise.race([
      lighthouse(url, {
        port: chrome.port,
        onlyCategories: ["performance"],
        output: "json",
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Lighthouse run timed out")), LIGHTHOUSE_TIMEOUT_MS),
      ),
    ]);

    const audits = runnerResult?.lhr?.audits;
    if (!audits) {
      issues.push("Lighthouse returned no audits");
      return { lcp_ms: null, cls: null, inp_ms: null };
    }

    const lcp = audits["largest-contentful-paint"]?.numericValue;
    const cls = audits["cumulative-layout-shift"]?.numericValue;

    return {
      lcp_ms: typeof lcp === "number" ? Math.round(lcp) : null,
      cls: typeof cls === "number" ? Math.round(cls * 1000) / 1000 : null,
      inp_ms: null,
    };
  } catch (err) {
    issues.push(
      `Core Web Vitals extraction failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    return { lcp_ms: null, cls: null, inp_ms: null };
  } finally {
    if (chrome) await chrome.kill();
  }
}
