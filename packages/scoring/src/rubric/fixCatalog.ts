import type { FixEase } from "@aiv/contracts";

/**
 * Fixed ease lookup, defined once per fix type — never re-derived per
 * scorecard, so the same fix always carries the same effort rating
 * regardless of which business it's being suggested for.
 *   1 = hard  (architecture / content investment, e.g. reducing JS dependency)
 *   2 = medium (requires new structured content, e.g. adding a schema block)
 *   3 = easy  (a markup/config edit against content that already exists)
 */
export const FIX_EASE = {
  add_local_business_fields: 3,
  add_local_business_schema: 2,
  add_service_fields: 3,
  add_service_schema: 2,
  expand_faq_schema: 3,
  add_faq_schema: 2,
  add_review_fields: 3,
  add_review_schema: 2,
  reduce_js_dependency: 1,
  unblock_ai_crawlers: 3,
  improve_landmark_coverage: 2,
  label_interactive_elements: 2,
  fix_heading_hierarchy: 3,
  add_plain_text_key_facts: 3,
  improve_paragraph_structure: 2,
  add_qa_formatting: 2,
} as const satisfies Record<string, FixEase>;

export type FixId = keyof typeof FIX_EASE;
