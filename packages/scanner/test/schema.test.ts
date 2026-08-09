import { describe, expect, it } from "vitest";
import { buildSchemaFindings, parseJsonLd } from "../src/extractors/schema.js";

describe("parseJsonLd", () => {
  it("flattens @graph wrappers into individual nodes", () => {
    const raw = [
      JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "Organization", name: "Acme" },
          { "@type": "WebSite", url: "https://acme.example" },
        ],
      }),
    ];
    const { nodes, parseErrors } = parseJsonLd(raw);
    expect(nodes).toHaveLength(2);
    expect(parseErrors).toHaveLength(0);
  });

  it("tolerates top-level arrays of nodes", () => {
    const raw = [JSON.stringify([{ "@type": "Organization" }, { "@type": "FAQPage" }])];
    const { nodes } = parseJsonLd(raw);
    expect(nodes).toHaveLength(2);
  });

  it("never throws on malformed JSON and records a parse error instead", () => {
    const raw = ["{not valid json", JSON.stringify({ "@type": "Organization" })];
    expect(() => parseJsonLd(raw)).not.toThrow();
    const { nodes, parseErrors } = parseJsonLd(raw);
    expect(nodes).toHaveLength(1);
    expect(parseErrors.length).toBeGreaterThan(0);
  });

  it("handles the real-world Domino's pattern: @graph containing null entries", () => {
    // Observed live on a real corpus candidate — @graph arrays are not
    // guaranteed to contain only objects.
    const raw = [
      JSON.stringify({
        "@graph": [null, null, { "@type": "BreadcrumbList", itemListElement: [] }],
      }),
    ];
    expect(() => parseJsonLd(raw)).not.toThrow();
    const { nodes } = parseJsonLd(raw);
    expect(nodes.filter((n) => n && typeof n === "object")).toHaveLength(1);
  });

  it("ignores empty script contents", () => {
    const { nodes, parseErrors } = parseJsonLd(["", "   "]);
    expect(nodes).toHaveLength(0);
    expect(parseErrors).toHaveLength(0);
  });
});

describe("buildSchemaFindings", () => {
  it("reports present:false for every type when no nodes are given", () => {
    const findings = buildSchemaFindings([]);
    expect(findings.local_business.present).toBe(false);
    expect(findings.local_business.fields_present).toHaveLength(0);
    expect(findings.local_business.fields_missing.length).toBeGreaterThan(0);
    expect(findings.service.present).toBe(false);
    expect(findings.faq_page.present).toBe(false);
    expect(findings.faq_page.question_count).toBe(0);
    expect(findings.review_aggregate.present).toBe(false);
  });

  it("detects a LocalBusiness subtype and reports partial field completeness", () => {
    const findings = buildSchemaFindings([
      {
        "@type": "Restaurant",
        name: "Franklin Barbecue",
        address: "900 East 11th Street",
        image: "https://example.com/photo.jpg",
      },
    ]);
    expect(findings.local_business.present).toBe(true);
    expect(findings.local_business.type_found).toBe("Restaurant");
    expect(findings.local_business.fields_present).toEqual(
      expect.arrayContaining(["name", "address", "image"]),
    );
    expect(findings.local_business.fields_missing).toEqual(
      expect.arrayContaining(["telephone", "priceRange"]),
    );
  });

  it("counts only genuine Question entries in a FAQPage's mainEntity", () => {
    const findings = buildSchemaFindings([
      {
        "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: "Q1", acceptedAnswer: { "@type": "Answer", text: "A1" } },
          { "@type": "Question", name: "Q2", acceptedAnswer: { "@type": "Answer", text: "A2" } },
          { "@type": "Thing", name: "not a question" },
        ],
      },
    ]);
    expect(findings.faq_page.present).toBe(true);
    expect(findings.faq_page.question_count).toBe(2);
  });

  it("finds AggregateRating nested inside a parent node's aggregateRating field", () => {
    const findings = buildSchemaFindings([
      {
        "@type": "LocalBusiness",
        name: "Acme",
        aggregateRating: { ratingValue: "4.5", reviewCount: "120" },
      },
    ]);
    expect(findings.review_aggregate.present).toBe(true);
    expect(findings.review_aggregate.fields_present).toEqual(
      expect.arrayContaining(["ratingValue", "reviewCount"]),
    );
  });

  it("does not classify a generic Organization as a LocalBusiness", () => {
    const findings = buildSchemaFindings([
      { "@type": "Organization", name: "Stripe", address: { "@type": "PostalAddress" } },
    ]);
    expect(findings.local_business.present).toBe(false);
  });
});
