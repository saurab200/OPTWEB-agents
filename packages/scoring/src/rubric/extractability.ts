import type { ContentExtractabilityFindings } from "@aiv/contracts";

/**
 * Content extractability — 10 pts. Primarily based on key_facts_in_plain_text
 * coverage, with avg_paragraph_word_count and qa_formatted_blocks as
 * secondary signals.
 *
 * JUDGMENT CALL: the rubric does not specify the primary/secondary point
 * split or the secondary-signal thresholds. We use KEY_FACTS_MAX=7 for the
 * primary signal (4 boolean facts, each worth KEY_FACTS_MAX/4) and 3 points
 * split evenly between the two secondary signals:
 *   - paragraph score: full credit once avg_paragraph_word_count reaches
 *     PARAGRAPH_FULL_CREDIT_WORDS (long enough to carry a complete,
 *     self-contained thought an LLM could quote), linear below that.
 *   - Q&A score: full credit at QA_FULL_CREDIT_BLOCKS or more on-page Q&A
 *     blocks (dt/dd pairs or question-headings), linear below that.
 */
export const EXTRACTABILITY_MAX = 10;
export const KEY_FACTS_MAX = 7;
export const PARAGRAPH_MAX = 1.5;
export const QA_MAX = 1.5;

const PARAGRAPH_FULL_CREDIT_WORDS = 15;
const QA_FULL_CREDIT_BLOCKS = 3;

export function scoreExtractability(extractability: ContentExtractabilityFindings): number {
  const facts = extractability.key_facts_in_plain_text;
  const factsPresent = [facts.hours, facts.address, facts.phone, facts.services].filter(Boolean).length;
  const keyFactsScore = KEY_FACTS_MAX * (factsPresent / 4);

  const paragraphScore =
    PARAGRAPH_MAX * Math.min(1, Math.max(0, extractability.avg_paragraph_word_count) / PARAGRAPH_FULL_CREDIT_WORDS);

  const qaScore =
    QA_MAX * Math.min(1, Math.max(0, extractability.qa_formatted_blocks) / QA_FULL_CREDIT_BLOCKS);

  return Math.min(EXTRACTABILITY_MAX, keyFactsScore + paragraphScore + qaScore);
}
