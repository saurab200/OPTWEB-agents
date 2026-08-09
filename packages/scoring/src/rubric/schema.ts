import type { SchemaFindings } from "@aiv/contracts";

/**
 * Schema completeness — 35 pts total.
 *   LocalBusiness/subtype: 15
 *   Service: 8
 *   FAQPage: 6
 *   Review/AggregateRating: 6
 * Each is proportional to field completeness (fields_present / total fields)
 * where the Findings contract carries fields_present/fields_missing.
 *
 * JUDGMENT CALL (flagged per the build brief): FaqPageFindings does not carry
 * fields_present/fields_missing — it only has `present` and `question_count`.
 * The rubric's "proportional to field completeness" instruction has nothing
 * to key off of for FAQPage specifically. We treat question_count as the
 * completeness proxy: 0 questions -> not really an FAQ (0 pts even if
 * `present` is technically true), scaling linearly up to full credit at
 * FAQ_FULL_CREDIT_QUESTION_COUNT questions. This is a documented substitute
 * for field-completeness, not a literal reading of the rubric text.
 */

export const LOCAL_BUSINESS_MAX = 15;
export const SERVICE_MAX = 8;
export const FAQ_MAX = 6;
export const REVIEW_MAX = 6;
export const SCHEMA_MAX = LOCAL_BUSINESS_MAX + SERVICE_MAX + FAQ_MAX + REVIEW_MAX;

const FAQ_FULL_CREDIT_QUESTION_COUNT = 4;

function fieldCompletenessScore(
  present: boolean,
  fields_present: string[],
  fields_missing: string[],
  max: number,
): number {
  if (!present) return 0;
  const total = fields_present.length + fields_missing.length;
  if (total === 0) return max; // present with no tracked fields to check — full credit
  return max * (fields_present.length / total);
}

export function scoreLocalBusiness(schema: SchemaFindings): number {
  const lb = schema.local_business;
  return fieldCompletenessScore(lb.present, lb.fields_present, lb.fields_missing, LOCAL_BUSINESS_MAX);
}

export function scoreService(schema: SchemaFindings): number {
  const svc = schema.service;
  return fieldCompletenessScore(svc.present, svc.fields_present, svc.fields_missing, SERVICE_MAX);
}

export function scoreFaqPage(schema: SchemaFindings): number {
  const faq = schema.faq_page;
  if (!faq.present || faq.question_count <= 0) return 0;
  const ratio = Math.min(1, faq.question_count / FAQ_FULL_CREDIT_QUESTION_COUNT);
  return FAQ_MAX * ratio;
}

export function scoreReviewAggregate(schema: SchemaFindings): number {
  const rev = schema.review_aggregate;
  return fieldCompletenessScore(rev.present, rev.fields_present, rev.fields_missing, REVIEW_MAX);
}

export function scoreSchema(schema: SchemaFindings): number {
  return (
    scoreLocalBusiness(schema) + scoreService(schema) + scoreFaqPage(schema) + scoreReviewAggregate(schema)
  );
}
