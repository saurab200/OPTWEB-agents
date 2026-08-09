import { describe, expect, it } from "vitest";
import { buildQueries } from "../src/queries.js";

describe("buildQueries", () => {
  it("produces 4 distinct realistic local-search phrasings", () => {
    const queries = buildQueries({ name: "Franklin Barbecue", category: "BBQ restaurant", city: "Austin" });
    expect(queries).toHaveLength(4);
    expect(new Set(queries).size).toBe(4);
    for (const q of queries) {
      expect(q).toContain("BBQ restaurant");
      expect(q).toContain("Austin");
    }
  });

  it("includes region in the place phrase when provided", () => {
    const queries = buildQueries({ name: "X", category: "plumber", city: "Austin", region: "TX" });
    for (const q of queries) {
      expect(q).toContain("Austin, TX");
    }
  });

  it("omits region cleanly when not provided", () => {
    const queries = buildQueries({ name: "X", category: "plumber", city: "Austin" });
    for (const q of queries) {
      expect(q).not.toContain("undefined");
      expect(q).toContain("Austin");
    }
  });
});
