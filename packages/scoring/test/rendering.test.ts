import { describe, expect, it } from "vitest";
import { RENDERING_MAX, scoreRendering } from "../src/rubric/rendering.js";

describe("scoreRendering", () => {
  it("gives full marks at 0% JS dependency", () => {
    expect(scoreRendering({ js_dependent_content_pct: 0, js_on_word_count: 100, js_off_word_count: 100 })).toBe(
      RENDERING_MAX,
    );
  });

  it("gives zero marks at 100% JS dependency", () => {
    expect(scoreRendering({ js_dependent_content_pct: 100, js_on_word_count: 100, js_off_word_count: 0 })).toBe(0);
  });

  it("matches the exact spec formula: 25 * (1 - pct/100)", () => {
    expect(scoreRendering({ js_dependent_content_pct: 40, js_on_word_count: 0, js_off_word_count: 0 })).toBeCloseTo(
      25 * (1 - 40 / 100),
      5,
    );
  });

  it("clamps out-of-range pct defensively rather than producing a negative score", () => {
    expect(scoreRendering({ js_dependent_content_pct: 150, js_on_word_count: 0, js_off_word_count: 0 })).toBe(0);
  });
});
