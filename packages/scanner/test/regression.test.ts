import { describe, expect, it } from "vitest";
import type { Browser } from "playwright";
import { extractRenderingFindings } from "../src/extractors/rendering.js";

/**
 * Regression test for fixtures/scanner_failures/cloudflare-js-render-timeout.json.
 *
 * Discovered live against https://www.cloudflare.com/: the JS-enabled render
 * timed out while the JS-disabled render succeeded with real content, which
 * produced js_on_word_count: 0 paired with js_off_word_count: 1109 — a
 * physically impossible pair (JS-enabled should never show less content than
 * JS-disabled) that silently computed to a misleading 0% JS-dependency.
 *
 * This test reproduces that exact failure shape with a mocked browser (no
 * live network dependency, so the regression case is deterministic) and
 * asserts the fix: the failed side is backfilled from the side that
 * succeeded, and the failure is still recorded in scan_issues.
 */
function makeMockBrowser(wordsOnSuccess: string): Browser {
  const page = {
    setDefaultNavigationTimeout: () => {},
    goto: async (_url: string, opts: { waitUntil: string }) => {
      if (opts.waitUntil === "networkidle") {
        throw new Error("Timeout 20000ms exceeded.");
      }
    },
    waitForTimeout: async () => {},
    evaluate: async () => wordsOnSuccess,
  };
  const context = {
    newPage: async () => page,
    close: async () => {},
  };
  return {
    newContext: async (opts: { javaScriptEnabled: boolean }) => {
      if (opts.javaScriptEnabled) {
        // js-enabled context still gets created, but its page.goto throws below.
        return context;
      }
      return context;
    },
  } as unknown as Browser;
}

describe("extractRenderingFindings regression: mismatched on/off render", () => {
  it("backfills the failed JS-enabled measurement instead of reporting an inconsistent pair", async () => {
    const words = Array.from({ length: 1109 }, (_, i) => `word${i}`).join(" ");
    const browser = makeMockBrowser(words);
    const issues: string[] = [];

    const rendering = await extractRenderingFindings(browser, "https://www.cloudflare.com/", issues);

    expect(rendering.js_on_word_count).toBe(rendering.js_off_word_count);
    expect(rendering.js_dependent_content_pct).toBe(0);
    expect(issues.some((i) => i.includes("JS-enabled render failed"))).toBe(true);
  });
});
