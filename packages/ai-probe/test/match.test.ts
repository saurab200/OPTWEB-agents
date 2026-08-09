import { describe, expect, it } from "vitest";
import { matchBusiness, namesMatch } from "../src/match.js";

describe("namesMatch", () => {
  it("matches identical names case-insensitively", () => {
    expect(namesMatch("Franklin Barbecue", "franklin barbecue")).toBe(true);
  });

  it("matches an alias that's a substring of the full name", () => {
    expect(namesMatch("Katz's", "Katz's Delicatessen")).toBe(true);
  });

  it("does not match unrelated names", () => {
    expect(namesMatch("Franklin Barbecue", "Terry Black's Barbecue")).toBe(false);
  });

  it("does not match on empty strings", () => {
    expect(namesMatch("", "Franklin Barbecue")).toBe(false);
    expect(namesMatch("Franklin Barbecue", "")).toBe(false);
  });

  it("ignores punctuation differences", () => {
    expect(namesMatch("Katz's Delicatessen", "Katzs Delicatessen")).toBe(true);
  });
});

describe("matchBusiness", () => {
  const business = { name: "Franklin Barbecue", category: "BBQ restaurant", city: "Austin" };

  it("reports mentioned:true with 1-based position when the business appears first", () => {
    const result = matchBusiness(["Franklin Barbecue", "Terry Black's Barbecue"], business);
    expect(result.mentioned).toBe(true);
    expect(result.mention_position).toBe(1);
    expect(result.competitors_mentioned).toEqual(["Terry Black's Barbecue"]);
  });

  it("finds the business at any position, not just first", () => {
    const result = matchBusiness(["La Barbecue", "Franklin Barbecue", "Terry Black's Barbecue"], business);
    expect(result.mention_position).toBe(2);
    expect(result.competitors_mentioned).toEqual(["La Barbecue", "Terry Black's Barbecue"]);
  });

  it("reports mentioned:false with a null position when absent entirely", () => {
    const result = matchBusiness(["La Barbecue", "Terry Black's Barbecue"], business);
    expect(result.mentioned).toBe(false);
    expect(result.mention_position).toBeNull();
    expect(result.competitors_mentioned).toEqual(["La Barbecue", "Terry Black's Barbecue"]);
  });

  it("matches via an alias even when the canonical name isn't used", () => {
    const withAlias = { ...business, aliases: ["Franklin's"] };
    const result = matchBusiness(["Franklin's", "La Barbecue"], withAlias);
    expect(result.mentioned).toBe(true);
    expect(result.mention_position).toBe(1);
  });

  it("handles an empty mentioned-names list without throwing", () => {
    expect(() => matchBusiness([], business)).not.toThrow();
    const result = matchBusiness([], business);
    expect(result.mentioned).toBe(false);
    expect(result.competitors_mentioned).toEqual([]);
  });
});
