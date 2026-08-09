import type { Findings, TopFix } from "@aiv/contracts";
import { FIX_EASE, type FixId } from "./fixCatalog.js";
import {
  LOCAL_BUSINESS_MAX,
  SERVICE_MAX,
  FAQ_MAX,
  REVIEW_MAX,
  scoreLocalBusiness,
  scoreService,
  scoreFaqPage,
  scoreReviewAggregate,
} from "./schema.js";
import { RENDERING_MAX, scoreRendering } from "./rendering.js";
import { CRAWLER_ACCESS_MAX, scoreCrawlerAccess } from "./crawlerAccess.js";
import { LANDMARK_WEIGHT, LABELED_WEIGHT, HEADING_PENALTY } from "./accessibility.js";
import { KEY_FACTS_MAX, PARAGRAPH_MAX, QA_MAX } from "./extractability.js";

const MIN_RECOVERABLE_POINTS = 1; // fixes rounding to <1 pt aren't worth surfacing

interface Candidate {
  id: FixId;
  category: string;
  description: string;
  points_recoverable: number; // pre-rounding
}

/**
 * Every number here is traceable to a specific Findings field and the exact
 * rubric constant it's short of — this is what "traceable to raw_findings"
 * means in practice for the fix suggestions, not just the category totals.
 */
function buildCandidates(findings: Findings): Candidate[] {
  const candidates: Candidate[] = [];
  const { schema, rendering, crawler_access, accessibility, content_extractability } = findings;

  // --- Schema ---
  const lb = schema.local_business;
  if (lb.present && lb.fields_missing.length > 0) {
    candidates.push({
      id: "add_local_business_fields",
      category: "schema",
      description: `Add missing LocalBusiness fields: ${lb.fields_missing.join(", ")}`,
      points_recoverable: LOCAL_BUSINESS_MAX - scoreLocalBusiness(schema),
    });
  } else if (!lb.present) {
    candidates.push({
      id: "add_local_business_schema",
      category: "schema",
      description: "Add LocalBusiness (or a more specific subtype) JSON-LD with core NAP fields",
      points_recoverable: LOCAL_BUSINESS_MAX,
    });
  }

  const svc = schema.service;
  if (svc.present && svc.fields_missing.length > 0) {
    candidates.push({
      id: "add_service_fields",
      category: "schema",
      description: `Add missing Service fields: ${svc.fields_missing.join(", ")}`,
      points_recoverable: SERVICE_MAX - scoreService(schema),
    });
  } else if (!svc.present) {
    candidates.push({
      id: "add_service_schema",
      category: "schema",
      description: "Add Service JSON-LD describing what you offer",
      points_recoverable: SERVICE_MAX,
    });
  }

  const faq = schema.faq_page;
  if (faq.present) {
    const gap = FAQ_MAX - scoreFaqPage(schema);
    if (gap > 0) {
      candidates.push({
        id: "expand_faq_schema",
        category: "schema",
        description: `Expand FAQPage beyond ${faq.question_count} question(s) toward 4+ Q&A pairs`,
        points_recoverable: gap,
      });
    }
  } else {
    candidates.push({
      id: "add_faq_schema",
      category: "schema",
      description: "Add FAQPage JSON-LD covering common customer questions",
      points_recoverable: FAQ_MAX,
    });
  }

  const rev = schema.review_aggregate;
  if (rev.present && rev.fields_missing.length > 0) {
    candidates.push({
      id: "add_review_fields",
      category: "schema",
      description: `Add missing AggregateRating fields: ${rev.fields_missing.join(", ")}`,
      points_recoverable: REVIEW_MAX - scoreReviewAggregate(schema),
    });
  } else if (!rev.present) {
    candidates.push({
      id: "add_review_schema",
      category: "schema",
      description: "Add AggregateRating/Review JSON-LD backed by real customer reviews",
      points_recoverable: REVIEW_MAX,
    });
  }

  // --- Rendering ---
  const renderingGap = RENDERING_MAX - scoreRendering(rendering);
  if (renderingGap > 0) {
    candidates.push({
      id: "reduce_js_dependency",
      category: "rendering",
      description: `Reduce JS-dependent content (currently ${rendering.js_dependent_content_pct}% of visible content requires JS) via server rendering or pre-rendering`,
      points_recoverable: renderingGap,
    });
  }

  // --- Crawler access ---
  const crawlerGap = CRAWLER_ACCESS_MAX - scoreCrawlerAccess(crawler_access);
  if (crawlerGap > 0) {
    const disallowed = Object.entries(crawler_access.bot_rules)
      .filter(([, status]) => status === "disallowed")
      .map(([bot]) => bot);
    candidates.push({
      id: "unblock_ai_crawlers",
      category: "crawler_access",
      description: `Remove robots.txt Disallow rules blocking: ${disallowed.join(", ")}`,
      points_recoverable: crawlerGap,
    });
  }

  // --- Accessibility ---
  const landmarkPct = Math.min(100, Math.max(0, accessibility.landmark_coverage_pct));
  const landmarkGap = LANDMARK_WEIGHT * (1 - landmarkPct / 100);
  if (landmarkGap > 0) {
    candidates.push({
      id: "improve_landmark_coverage",
      category: "accessibility",
      description: "Add missing ARIA landmarks (banner/navigation/main/contentinfo)",
      points_recoverable: landmarkGap,
    });
  }

  const labeledPct = Math.min(100, Math.max(0, accessibility.labeled_interactive_pct));
  const labeledGap = LABELED_WEIGHT * (1 - labeledPct / 100);
  if (labeledGap > 0) {
    candidates.push({
      id: "label_interactive_elements",
      category: "accessibility",
      description: "Add accessible names to unlabeled buttons/links/form controls",
      points_recoverable: labeledGap,
    });
  }

  if (!accessibility.heading_hierarchy_valid || accessibility.h1_count !== 1) {
    candidates.push({
      id: "fix_heading_hierarchy",
      category: "accessibility",
      description: `Fix heading structure (heading_hierarchy_valid=${accessibility.heading_hierarchy_valid}, h1_count=${accessibility.h1_count}) — use exactly one <h1> and no skipped levels`,
      points_recoverable: HEADING_PENALTY,
    });
  }

  // --- Extractability ---
  const facts = content_extractability.key_facts_in_plain_text;
  const missingFacts = (["hours", "address", "phone", "services"] as const).filter((k) => !facts[k]);
  if (missingFacts.length > 0) {
    candidates.push({
      id: "add_plain_text_key_facts",
      category: "extractability",
      description: `State these facts in plain page text: ${missingFacts.join(", ")}`,
      points_recoverable: KEY_FACTS_MAX * (missingFacts.length / 4),
    });
  }

  if (content_extractability.avg_paragraph_word_count < 15) {
    candidates.push({
      id: "improve_paragraph_structure",
      category: "extractability",
      description: `Write fuller paragraphs (avg is ${content_extractability.avg_paragraph_word_count} words; aim for 15+)`,
      points_recoverable: PARAGRAPH_MAX * (1 - Math.max(0, content_extractability.avg_paragraph_word_count) / 15),
    });
  }

  if (content_extractability.qa_formatted_blocks < 3) {
    candidates.push({
      id: "add_qa_formatting",
      category: "extractability",
      description: "Add on-page Q&A formatting (definition lists or question-style headings) for common queries",
      points_recoverable: QA_MAX * (1 - content_extractability.qa_formatted_blocks / 3),
    });
  }

  return candidates;
}

export function computeTopFixes(findings: Findings): TopFix[] {
  const candidates = buildCandidates(findings)
    .map((c) => ({ ...c, points_recoverable: Math.round(c.points_recoverable) }))
    .filter((c) => c.points_recoverable >= MIN_RECOVERABLE_POINTS);

  const ranked = [...candidates].sort((a, b) => {
    const aEase = FIX_EASE[a.id];
    const bEase = FIX_EASE[b.id];
    const scoreDiff = b.points_recoverable * bEase - a.points_recoverable * aEase;
    if (scoreDiff !== 0) return scoreDiff;
    return bEase - aEase; // tie-break: easier wins
  });

  return ranked.slice(0, 3).map((c) => ({
    category: c.category,
    description: c.description,
    points_recoverable: c.points_recoverable,
    ease: FIX_EASE[c.id],
  }));
}
