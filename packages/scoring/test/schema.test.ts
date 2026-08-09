import { describe, expect, it } from "vitest";
import type { SchemaFindings } from "@aiv/contracts";
import {
  FAQ_MAX,
  LOCAL_BUSINESS_MAX,
  REVIEW_MAX,
  SCHEMA_MAX,
  SERVICE_MAX,
  scoreFaqPage,
  scoreLocalBusiness,
  scoreReviewAggregate,
  scoreSchema,
  scoreService,
} from "../src/rubric/schema.js";

function emptySchema(): SchemaFindings {
  return {
    local_business: { present: false, type_found: null, fields_present: [], fields_missing: [] },
    service: { present: false, fields_present: [], fields_missing: [] },
    faq_page: { present: false, question_count: 0 },
    review_aggregate: { present: false, fields_present: [], fields_missing: [] },
  };
}

describe("SCHEMA_MAX", () => {
  it("sums to 35 as specified (15+8+6+6)", () => {
    expect(SCHEMA_MAX).toBe(35);
    expect(LOCAL_BUSINESS_MAX).toBe(15);
    expect(SERVICE_MAX).toBe(8);
    expect(FAQ_MAX).toBe(6);
    expect(REVIEW_MAX).toBe(6);
  });
});

describe("scoreLocalBusiness", () => {
  it("is 0 when absent", () => {
    expect(scoreLocalBusiness(emptySchema())).toBe(0);
  });

  it("is full marks when present with no missing fields", () => {
    const schema = emptySchema();
    schema.local_business = {
      present: true,
      type_found: "Restaurant",
      fields_present: ["name", "address"],
      fields_missing: [],
    };
    expect(scoreLocalBusiness(schema)).toBe(LOCAL_BUSINESS_MAX);
  });

  it("is proportional to field completeness, not just presence", () => {
    const schema = emptySchema();
    schema.local_business = {
      present: true,
      type_found: "LocalBusiness",
      fields_present: ["name"],
      fields_missing: ["address", "telephone"],
    };
    // 1 of 3 fields present -> 15 * (1/3) = 5
    expect(scoreLocalBusiness(schema)).toBeCloseTo(5, 5);
  });
});

describe("scoreFaqPage (documented judgment call: question_count as completeness proxy)", () => {
  it("is 0 when absent", () => {
    expect(scoreFaqPage(emptySchema())).toBe(0);
  });

  it("is 0 when present but has zero real questions", () => {
    const schema = emptySchema();
    schema.faq_page = { present: true, question_count: 0 };
    expect(scoreFaqPage(schema)).toBe(0);
  });

  it("scales linearly below the full-credit question count", () => {
    const schema = emptySchema();
    schema.faq_page = { present: true, question_count: 2 };
    // full credit at 4 questions -> 2/4 = 50%
    expect(scoreFaqPage(schema)).toBeCloseTo(FAQ_MAX * 0.5, 5);
  });

  it("caps at full credit beyond the full-credit threshold", () => {
    const schema = emptySchema();
    schema.faq_page = { present: true, question_count: 20 };
    expect(scoreFaqPage(schema)).toBe(FAQ_MAX);
  });
});

describe("scoreService and scoreReviewAggregate", () => {
  it("follow the same field-completeness proportionality as LocalBusiness", () => {
    const schema = emptySchema();
    schema.service = { present: true, fields_present: ["name", "serviceType"], fields_missing: [] };
    expect(scoreService(schema)).toBe(SERVICE_MAX);

    schema.review_aggregate = {
      present: true,
      fields_present: ["ratingValue"],
      fields_missing: ["reviewCount", "bestRating", "itemReviewed"],
    };
    expect(scoreReviewAggregate(schema)).toBeCloseTo(REVIEW_MAX * 0.25, 5);
  });
});

describe("scoreSchema", () => {
  it("sums all four sub-scores and never exceeds SCHEMA_MAX", () => {
    const schema = emptySchema();
    schema.local_business = { present: true, type_found: "LocalBusiness", fields_present: ["name"], fields_missing: [] };
    schema.service = { present: true, fields_present: ["name"], fields_missing: [] };
    schema.faq_page = { present: true, question_count: 10 };
    schema.review_aggregate = { present: true, fields_present: ["ratingValue"], fields_missing: [] };
    expect(scoreSchema(schema)).toBe(SCHEMA_MAX);
  });

  it("is 0 for a completely bare schema", () => {
    expect(scoreSchema(emptySchema())).toBe(0);
  });
});
