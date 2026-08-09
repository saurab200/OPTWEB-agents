/**
 * Findings is the sole contract between the Scanner Agent and the Scoring Agent.
 * Changes to this shape are breaking-change events: update scanner and scoring
 * deliberately together, never incidentally.
 */

export type ScanConfidence = "high" | "medium" | "low";

export type BotRuleStatus = "allowed" | "disallowed" | "unspecified";

/** Bots that AI-visibility auditing cares about — checked against robots.txt. */
export const TRACKED_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "PerplexityBot",
  "Google-Extended",
  "Bingbot",
  "anthropic-ai",
] as const;

export type TrackedBot = (typeof TRACKED_BOTS)[number];

export interface SchemaTypeFindings {
  present: boolean;
  type_found: string | null;
  fields_present: string[];
  fields_missing: string[];
}

export interface SchemaTypeFindingsNoType {
  present: boolean;
  fields_present: string[];
  fields_missing: string[];
}

export interface FaqPageFindings {
  present: boolean;
  question_count: number;
}

export interface SchemaFindings {
  local_business: SchemaTypeFindings;
  service: SchemaTypeFindingsNoType;
  faq_page: FaqPageFindings;
  review_aggregate: SchemaTypeFindingsNoType;
}

export interface RenderingFindings {
  js_dependent_content_pct: number; // 0-100
  js_on_word_count: number;
  js_off_word_count: number;
}

export interface CrawlerAccessFindings {
  robots_txt_found: boolean;
  llms_txt_found: boolean;
  bot_rules: Record<string, BotRuleStatus>;
}

export interface AccessibilityFindings {
  landmark_coverage_pct: number;
  labeled_interactive_pct: number;
  heading_hierarchy_valid: boolean;
  h1_count: number;
}

export interface CoreWebVitalsFindings {
  lcp_ms: number | null;
  cls: number | null;
  inp_ms: number | null;
}

export interface KeyFactsInPlainText {
  hours: boolean;
  address: boolean;
  phone: boolean;
  services: boolean;
}

export interface ContentExtractabilityFindings {
  avg_paragraph_word_count: number;
  qa_formatted_blocks: number;
  key_facts_in_plain_text: KeyFactsInPlainText;
}

export interface Findings {
  url: string;
  scanned_at: string; // ISO 8601 timestamp
  schema: SchemaFindings;
  rendering: RenderingFindings;
  crawler_access: CrawlerAccessFindings;
  accessibility: AccessibilityFindings;
  core_web_vitals: CoreWebVitalsFindings;
  content_extractability: ContentExtractabilityFindings;
  scan_confidence: ScanConfidence;
  scan_issues: string[];
}
