import type { Page } from "playwright";
import type { AccessibilityFindings } from "@aiv/contracts";

// Flat accessibility node as returned by Chrome DevTools Protocol's
// Accessibility.getFullAXTree — Playwright's own page.accessibility.snapshot()
// helper was removed upstream, so we drive CDP directly. A flat list is all
// we need: landmark/interactive-element checks don't require tree shape.
export interface AXNode {
  role: string;
  name?: string;
}

// The four landmarks an answer engine / screen reader needs to orient a page.
// A documented judgment call: "search" and "complementary" are useful but not
// counted as required, since most small-business sites legitimately omit them.
const CANONICAL_LANDMARK_ROLES = ["banner", "navigation", "main", "contentinfo"] as const;

const INTERACTIVE_ROLES = new Set([
  "button",
  "link",
  "textbox",
  "checkbox",
  "radio",
  "combobox",
  "slider",
  "switch",
  "menuitem",
  "tab",
  "searchbox",
]);

export function computeLandmarkCoveragePct(nodes: AXNode[]): number {
  const found = new Set<string>();
  for (const n of nodes) {
    if (CANONICAL_LANDMARK_ROLES.includes(n.role as (typeof CANONICAL_LANDMARK_ROLES)[number])) {
      found.add(n.role);
    }
  }
  return Math.round((found.size / CANONICAL_LANDMARK_ROLES.length) * 10000) / 100;
}

export function computeLabeledInteractivePct(nodes: AXNode[]): number {
  let total = 0;
  let labeled = 0;
  for (const n of nodes) {
    if (INTERACTIVE_ROLES.has(n.role)) {
      total += 1;
      if (n.name && n.name.trim().length > 0) labeled += 1;
    }
  }
  // Vacuously "fully labeled" when a page has no interactive elements at all —
  // a documented judgment call rather than penalizing static content pages.
  if (total === 0) return 100;
  return Math.round((labeled / total) * 10000) / 100;
}

export interface HeadingInfo {
  level: number;
}

/** No skipped levels going deeper (h1 -> h3 invalid), multiple same-level siblings are fine. */
export function isHeadingHierarchyValid(headings: HeadingInfo[]): boolean {
  let previousLevel = 0;
  for (const h of headings) {
    if (previousLevel > 0 && h.level > previousLevel + 1) return false;
    previousLevel = h.level;
  }
  return true;
}

async function getHeadings(page: Page): Promise<HeadingInfo[]> {
  return page.evaluate(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6,[role='heading']"),
    );
    return nodes.map((el) => {
      const ariaLevel = el.getAttribute("aria-level");
      if (ariaLevel) return { level: parseInt(ariaLevel, 10) || 1 };
      const match = /^H([1-6])$/.exec(el.tagName);
      return { level: match ? parseInt(match[1], 10) : 1 };
    });
  });
}

interface CDPAXNode {
  role?: { value?: string };
  name?: { value?: string };
}

async function getAXNodes(page: Page): Promise<AXNode[]> {
  const client = await page.context().newCDPSession(page);
  try {
    const { nodes } = (await client.send("Accessibility.getFullAXTree")) as {
      nodes: CDPAXNode[];
    };
    return nodes
      .filter((n) => n.role?.value)
      .map((n) => ({ role: n.role!.value as string, name: n.name?.value }));
  } finally {
    await client.detach().catch(() => {});
  }
}

export async function extractAccessibilityFindings(
  page: Page,
  issues: string[],
): Promise<AccessibilityFindings> {
  let axNodes: AXNode[] = [];
  try {
    axNodes = await getAXNodes(page);
  } catch (err) {
    issues.push(
      `Accessibility tree extraction failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  let headings: HeadingInfo[] = [];
  let h1_count = 0;
  try {
    headings = await getHeadings(page);
    h1_count = await page.locator("h1").count();
  } catch (err) {
    issues.push(`Heading extraction failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  return {
    landmark_coverage_pct: computeLandmarkCoveragePct(axNodes),
    labeled_interactive_pct: computeLabeledInteractivePct(axNodes),
    heading_hierarchy_valid: isHeadingHierarchyValid(headings),
    h1_count,
  };
}
