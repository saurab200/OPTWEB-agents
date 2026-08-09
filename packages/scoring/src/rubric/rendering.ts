import type { RenderingFindings } from "@aiv/contracts";

/** Rendering accessibility — 25 pts. 25 * (1 - js_dependent_content_pct / 100), per spec exactly. */
export const RENDERING_MAX = 25;

export function scoreRendering(rendering: RenderingFindings): number {
  const pct = Math.min(100, Math.max(0, rendering.js_dependent_content_pct));
  return RENDERING_MAX * (1 - pct / 100);
}
