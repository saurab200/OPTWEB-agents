import { describe, expect, it } from "vitest";
import { computeJsDependentPct, countWords } from "../src/extractors/rendering.js";

describe("countWords", () => {
  it("counts whitespace-separated words", () => {
    expect(countWords("hello world foo")).toBe(3);
  });

  it("returns 0 for empty or whitespace-only text", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   \n\t  ")).toBe(0);
  });

  it("collapses repeated whitespace", () => {
    expect(countWords("a   b\n\nc")).toBe(3);
  });
});

describe("computeJsDependentPct", () => {
  it("returns 0 when JS-on and JS-off word counts are equal", () => {
    expect(computeJsDependentPct(500, 500)).toBe(0);
  });

  it("returns close to 100 when JS-off has almost no content", () => {
    expect(computeJsDependentPct(1000, 10)).toBeCloseTo(99, 0);
  });

  it("clamps to 0 when JS-off somehow exceeds JS-on (never negative)", () => {
    expect(computeJsDependentPct(100, 150)).toBe(0);
  });

  it("returns 0 when js_on_word_count is 0 (avoids NaN/divide-by-zero)", () => {
    expect(computeJsDependentPct(0, 0)).toBe(0);
    expect(computeJsDependentPct(0, 50)).toBe(0);
  });

  it("matches the js-heavy-spa corpus property: mostly-empty JS-off page yields high pct", () => {
    // Observed live on excalidraw.com: js_on=64, js_off=10 -> ~84%.
    const pct = computeJsDependentPct(64, 10);
    expect(pct).toBeGreaterThan(50);
  });
});
