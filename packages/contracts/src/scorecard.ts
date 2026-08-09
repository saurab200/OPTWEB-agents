import type { Findings, ScanConfidence } from "./findings.js";
import type { ProbeResult } from "./probe.js";

export type FixEase = 1 | 2 | 3;

export interface TopFix {
  category: string;
  description: string;
  points_recoverable: number;
  ease: FixEase;
}

export interface CategoryScores {
  schema: number;
  rendering: number;
  crawler_access: number;
  accessibility: number;
  extractability: number;
  /** Present only when score() was called with a ProbeResult. 0 to AI_VISIBILITY_MAX (20). */
  ai_visibility?: number;
}

/**
 * total_score's ceiling is NOT always 100: it's 100 when score() is called
 * with Findings alone (the original 5-category rubric, unchanged), and 120
 * when a ProbeResult is also supplied (adds the ai_visibility category).
 * total_score_max always reflects the true ceiling for this specific
 * Scorecard so consumers never have to guess or assume 100.
 */
export interface Scorecard {
  url: string;
  total_score: number;
  total_score_max: number; // 100 or 120
  category_scores: CategoryScores;
  top_fixes: TopFix[]; // max 3, ranked by points_recoverable * ease
  scan_confidence: ScanConfidence; // passed through from Findings
  raw_findings: Findings;
  /** Present only when score() was called with a ProbeResult — the exact input behind ai_visibility. */
  raw_probe?: ProbeResult;
}
