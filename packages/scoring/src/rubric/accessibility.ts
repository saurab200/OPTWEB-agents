import type { AccessibilityFindings } from "@aiv/contracts";

/**
 * Accessibility tree quality — 15 pts. Weighted combination of
 * landmark_coverage_pct and labeled_interactive_pct, plus a flat penalty if
 * heading_hierarchy_valid is false or h1_count != 1.
 *
 * JUDGMENT CALL: the rubric names the three inputs but not their exact
 * weights or the penalty magnitude. We split the 15 pts evenly across the
 * two percentage signals (LANDMARK_WEIGHT=7.5, LABELED_WEIGHT=7.5) and apply
 * a single flat HEADING_PENALTY if either heading condition is violated
 * (read as one combined penalty trigger, not two stacking penalties, since
 * the rubric phrases it as one flat penalty governed by an "or").
 */
export const ACCESSIBILITY_MAX = 15;
export const LANDMARK_WEIGHT = 7.5;
export const LABELED_WEIGHT = 7.5;
export const HEADING_PENALTY = 4;

export function scoreAccessibility(accessibility: AccessibilityFindings): number {
  const landmarkScore = LANDMARK_WEIGHT * (Math.min(100, Math.max(0, accessibility.landmark_coverage_pct)) / 100);
  const labeledScore = LABELED_WEIGHT * (Math.min(100, Math.max(0, accessibility.labeled_interactive_pct)) / 100);
  const headingViolation = !accessibility.heading_hierarchy_valid || accessibility.h1_count !== 1;
  const penalty = headingViolation ? HEADING_PENALTY : 0;
  return Math.max(0, Math.min(ACCESSIBILITY_MAX, landmarkScore + labeledScore - penalty));
}
