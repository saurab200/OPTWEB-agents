import type { Findings, Scorecard } from "@aiv/contracts";
import { score } from "../index.js";

/**
 * Projects a "what if every identified gap were fixed" version of Findings —
 * the factual counterpart to top_fixes. Every field this touches is exactly
 * the field the corresponding rubric module in rubric/*.ts reads, so
 * projectPotentialScorecard(findings) - score(findings) is fully traceable
 * back to the same gaps top_fixes already names. This is a deterministic
 * simulation of the rubric, not a prediction about the real world — it
 * answers "what would this page's OWN measured data need to look like to
 * max out the rubric," nothing more.
 */
export function projectPotentialFindings(findings: Findings): Findings {
  const dedupe = (a: string[], b: string[]): string[] => Array.from(new Set([...a, ...b]));

  return {
    ...findings,
    schema: {
      local_business: {
        present: true,
        type_found: findings.schema.local_business.type_found ?? "LocalBusiness",
        fields_present: dedupe(
          findings.schema.local_business.fields_present,
          findings.schema.local_business.fields_missing,
        ),
        fields_missing: [],
      },
      service: {
        present: true,
        fields_present: dedupe(findings.schema.service.fields_present, findings.schema.service.fields_missing),
        fields_missing: [],
      },
      faq_page: {
        present: true,
        question_count: Math.max(findings.schema.faq_page.question_count, 4),
      },
      review_aggregate: {
        present: true,
        fields_present: dedupe(
          findings.schema.review_aggregate.fields_present,
          findings.schema.review_aggregate.fields_missing,
        ),
        fields_missing: [],
      },
    },
    rendering: {
      ...findings.rendering,
      js_dependent_content_pct: 0,
    },
    crawler_access: {
      ...findings.crawler_access,
      bot_rules: Object.fromEntries(
        Object.keys(findings.crawler_access.bot_rules).map((bot) => [bot, "allowed" as const]),
      ),
    },
    accessibility: {
      landmark_coverage_pct: 100,
      labeled_interactive_pct: 100,
      heading_hierarchy_valid: true,
      h1_count: 1,
    },
    content_extractability: {
      avg_paragraph_word_count: Math.max(findings.content_extractability.avg_paragraph_word_count, 15),
      qa_formatted_blocks: Math.max(findings.content_extractability.qa_formatted_blocks, 3),
      key_facts_in_plain_text: { hours: true, address: true, phone: true, services: true },
    },
  };
}

export function projectPotentialScorecard(findings: Findings): Scorecard {
  return score(projectPotentialFindings(findings));
}
