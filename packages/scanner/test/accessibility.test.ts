import { describe, expect, it } from "vitest";
import {
  computeLabeledInteractivePct,
  computeLandmarkCoveragePct,
  isHeadingHierarchyValid,
} from "../src/extractors/accessibility.js";

describe("computeLandmarkCoveragePct", () => {
  it("returns 100 when all four canonical landmarks are present", () => {
    const nodes = [
      { role: "banner" },
      { role: "navigation" },
      { role: "main" },
      { role: "contentinfo" },
    ];
    expect(computeLandmarkCoveragePct(nodes)).toBe(100);
  });

  it("returns 0 when no landmarks are present", () => {
    expect(computeLandmarkCoveragePct([{ role: "button" }])).toBe(0);
  });

  it("returns 50 when exactly half of the canonical landmarks are present", () => {
    const nodes = [{ role: "main" }, { role: "navigation" }];
    expect(computeLandmarkCoveragePct(nodes)).toBe(50);
  });

  it("does not double count a repeated landmark role", () => {
    const nodes = [{ role: "main" }, { role: "main" }];
    expect(computeLandmarkCoveragePct(nodes)).toBe(25);
  });
});

describe("computeLabeledInteractivePct", () => {
  it("returns 100 (vacuously) when there are no interactive elements", () => {
    expect(computeLabeledInteractivePct([{ role: "heading" }])).toBe(100);
  });

  it("returns 100 when every interactive element has a non-empty name", () => {
    const nodes = [
      { role: "button", name: "Submit" },
      { role: "link", name: "Home" },
    ];
    expect(computeLabeledInteractivePct(nodes)).toBe(100);
  });

  it("penalizes unlabeled interactive elements proportionally", () => {
    const nodes = [
      { role: "button", name: "Submit" },
      { role: "button", name: "" },
    ];
    expect(computeLabeledInteractivePct(nodes)).toBe(50);
  });

  it("treats whitespace-only names as unlabeled", () => {
    const nodes = [{ role: "button", name: "   " }];
    expect(computeLabeledInteractivePct(nodes)).toBe(0);
  });
});

describe("isHeadingHierarchyValid", () => {
  it("accepts a normal sequential hierarchy", () => {
    expect(isHeadingHierarchyValid([{ level: 1 }, { level: 2 }, { level: 3 }, { level: 2 }])).toBe(
      true,
    );
  });

  it("accepts an empty heading list", () => {
    expect(isHeadingHierarchyValid([])).toBe(true);
  });

  it("rejects a skipped level going deeper (h1 -> h3)", () => {
    expect(isHeadingHierarchyValid([{ level: 1 }, { level: 3 }])).toBe(false);
  });

  it("allows multiple headings at the same level", () => {
    expect(isHeadingHierarchyValid([{ level: 1 }, { level: 2 }, { level: 2 }])).toBe(true);
  });

  it("allows jumping back up to a shallower level at any point", () => {
    expect(isHeadingHierarchyValid([{ level: 1 }, { level: 2 }, { level: 3 }, { level: 1 }])).toBe(
      true,
    );
  });
});
