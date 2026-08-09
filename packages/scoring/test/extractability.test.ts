import { describe, expect, it } from "vitest";
import type { ContentExtractabilityFindings } from "@aiv/contracts";
import { EXTRACTABILITY_MAX, scoreExtractability } from "../src/rubric/extractability.js";

function findings(overrides: Partial<ContentExtractabilityFindings>): ContentExtractabilityFindings {
  return {
    avg_paragraph_word_count: 20,
    qa_formatted_blocks: 3,
    key_facts_in_plain_text: { hours: true, address: true, phone: true, services: true },
    ...overrides,
  };
}

describe("scoreExtractability", () => {
  it("gives full marks when all key facts are present and secondary signals are strong", () => {
    expect(scoreExtractability(findings({}))).toBe(EXTRACTABILITY_MAX);
  });

  it("is 0 when nothing is extractable", () => {
    const zero = scoreExtractability(
      findings({
        avg_paragraph_word_count: 0,
        qa_formatted_blocks: 0,
        key_facts_in_plain_text: { hours: false, address: false, phone: false, services: false },
      }),
    );
    expect(zero).toBe(0);
  });

  it("is proportional to key-facts coverage as the primary signal", () => {
    const twoOfFour = scoreExtractability(
      findings({
        key_facts_in_plain_text: { hours: true, address: true, phone: false, services: false },
      }),
    );
    const fourOfFour = scoreExtractability(findings({}));
    expect(twoOfFour).toBeLessThan(fourOfFour);
  });

  it("treats avg_paragraph_word_count and qa_formatted_blocks as secondary, smaller-magnitude signals", () => {
    const noFacts = scoreExtractability(
      findings({ key_facts_in_plain_text: { hours: false, address: false, phone: false, services: false } }),
    );
    // Even with strong secondary signals, missing all primary facts should keep the score low.
    expect(noFacts).toBeLessThan(EXTRACTABILITY_MAX * 0.5);
  });
});
