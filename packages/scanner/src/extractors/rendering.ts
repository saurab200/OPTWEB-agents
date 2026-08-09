import type { Browser } from "playwright";
import type { RenderingFindings } from "@aiv/contracts";

const NAV_TIMEOUT_MS = 20000;

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/** Percent of visible word count that only appears once JS executes. Clamped to [0, 100]. */
export function computeJsDependentPct(jsOnWordCount: number, jsOffWordCount: number): number {
  if (jsOnWordCount <= 0) return 0;
  const pct = ((jsOnWordCount - jsOffWordCount) / jsOnWordCount) * 100;
  return Math.min(100, Math.max(0, Math.round(pct * 100) / 100));
}

async function getBodyWordCount(
  browser: Browser,
  url: string,
  javaScriptEnabled: boolean,
): Promise<number> {
  const context = await browser.newContext({ javaScriptEnabled });
  try {
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(NAV_TIMEOUT_MS);
    await page.goto(url, { waitUntil: javaScriptEnabled ? "networkidle" : "load" });
    if (javaScriptEnabled) {
      // Give any late client-side rendering a brief window to settle.
      await page.waitForTimeout(500);
    }
    const text = await page.evaluate(() => document.body?.innerText ?? "");
    return countWords(text);
  } finally {
    await context.close();
  }
}

export async function extractRenderingFindings(
  browser: Browser,
  url: string,
  issues: string[],
): Promise<RenderingFindings> {
  let js_on_word_count = 0;
  let js_on_ok = false;
  let js_off_word_count = 0;
  let js_off_ok = false;

  try {
    js_on_word_count = await getBodyWordCount(browser, url, true);
    js_on_ok = true;
  } catch (err) {
    issues.push(`JS-enabled render failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    js_off_word_count = await getBodyWordCount(browser, url, false);
    js_off_ok = true;
  } catch (err) {
    issues.push(`JS-disabled render failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // If one side's measurement failed, backfill it from the side that
  // succeeded. Leaving a fabricated 0 in a failed slot can pair with a real
  // count on the other side to produce a physically inconsistent, misleading
  // result (see fixtures/scanner_failures/cloudflare-js-render-timeout.json).
  // scan_issues above already records the underlying failure.
  if (!js_on_ok && js_off_ok) js_on_word_count = js_off_word_count;
  if (!js_off_ok && js_on_ok) js_off_word_count = js_on_word_count;

  return {
    js_dependent_content_pct: computeJsDependentPct(js_on_word_count, js_off_word_count),
    js_on_word_count,
    js_off_word_count,
  };
}
