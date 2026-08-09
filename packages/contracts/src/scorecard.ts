import type { Findings, ScanConfidence } from "./findings.js";

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
}

export interface Scorecard {
  url: string;
  total_score: number; // 0-100
  category_scores: CategoryScores;
  top_fixes: TopFix[]; // max 3, ranked by points_recoverable * ease
  scan_confidence: ScanConfidence; // passed through from Findings
  raw_findings: Findings;
}
