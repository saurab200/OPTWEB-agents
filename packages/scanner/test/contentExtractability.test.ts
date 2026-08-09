import { describe, expect, it } from "vitest";
import {
  computeAvgParagraphWordCount,
  detectAddress,
  detectHours,
  detectPhone,
  detectServices,
} from "../src/extractors/contentExtractability.js";

describe("detectPhone", () => {
  it("matches common US phone formats", () => {
    expect(detectPhone("Call us at (512) 653-1187 today")).toBe(true);
    expect(detectPhone("Call us at 512-653-1187 today")).toBe(true);
    expect(detectPhone("Call us at 512.653.1187 today")).toBe(true);
  });

  it("does not match plain numbers with no phone shape", () => {
    expect(detectPhone("We opened in 1955 and have 400 seats")).toBe(false);
  });
});

describe("detectAddress", () => {
  it("matches a street-address-shaped string", () => {
    expect(detectAddress("900 East 11th Street, Austin, TX 78702")).toBe(true);
  });

  it("does not match plain prose with numbers", () => {
    expect(detectAddress("We've served 900 customers this year")).toBe(false);
  });
});

describe("detectHours", () => {
  it("matches day + time-of-day patterns", () => {
    expect(detectHours("Monday-Friday 9:00am - 5:00pm")).toBe(true);
    expect(detectHours("Hours: 9am to 5pm")).toBe(true);
  });

  it("does not match unrelated text", () => {
    expect(detectHours("Our team has decades of combined experience")).toBe(false);
  });
});

describe("detectServices", () => {
  it("matches common services-section phrasing", () => {
    expect(detectServices("Our Services include plumbing and electrical work")).toBe(true);
    expect(detectServices("We offer same-day appointments")).toBe(true);
  });

  it("does not match unrelated text", () => {
    expect(detectServices("Thanks for visiting our website")).toBe(false);
  });
});

describe("computeAvgParagraphWordCount", () => {
  it("averages word counts across non-empty paragraphs", () => {
    expect(computeAvgParagraphWordCount(["one two three", "four five"])).toBe(2.5);
  });

  it("ignores empty/whitespace-only paragraphs", () => {
    expect(computeAvgParagraphWordCount(["one two", "   ", ""])).toBe(2);
  });

  it("returns 0 for no paragraphs at all", () => {
    expect(computeAvgParagraphWordCount([])).toBe(0);
  });
});
