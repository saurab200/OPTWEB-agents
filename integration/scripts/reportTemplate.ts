import type { Findings, ProbeResult, Scorecard } from "@aiv/contracts";
import {
  type ImpactEstimate,
  SCHEMA_MAX,
  RENDERING_MAX,
  CRAWLER_ACCESS_MAX,
  ACCESSIBILITY_MAX,
  EXTRACTABILITY_MAX,
  AI_VISIBILITY_MAX,
} from "@aiv/scoring";

export interface HistoryPoint {
  timestamp: string;
  total_score: number;
  /** 100 or 120 depending on whether that run included an AI-Probe result — kept per-point since a
   * business's history can mix probed and unprobed runs (probing is opt-in, costs real credit). */
  total_score_max: number;
}

/**
 * Real scores from other real, independently-scanned businesses in the same
 * local market — e.g. the other Austin dentists in this batch. Every entry
 * must come from an actual score() run against that business's actual site.
 * Optional: when omitted, the competitive-standing section renders nothing
 * rather than a fake "you're #1 in your area!" placeholder.
 */
export interface CompetitorScore {
  name: string;
  url: string;
  total_score: number;
  total_score_max: number;
}

/**
 * Configuration for the closing call-to-action. Every field here is a real
 * business fact (capacity, price, contact info) that must be supplied by
 * the person running the audit — this template deliberately has no default
 * price, slot count, or urgency copy, since inventing one would be exactly
 * the fabricated-scarcity pattern this project's guardrails exist to avoid.
 * When `cta` is omitted entirely, the section renders a neutral contact
 * prompt with no urgency language at all.
 */
export interface CtaConfig {
  /** e.g. "3" — must be a true current capacity constraint, not a made-up number. */
  remainingSlots?: number;
  /** e.g. "this month" — the real period the slot count above applies to. */
  slotsPeriod?: string;
  /** e.g. "Free 15-minute fix walkthrough" — the real next step being offered. */
  offerLabel: string;
  /** Where the CTA button/link points — a real booking link, mailto, or phone. */
  contactHref: string;
  /** Button text, e.g. "Book my walkthrough". */
  contactLabel: string;
}

export interface ReportData {
  url: string;
  findings: Findings;
  current: Scorecard;
  potential: Scorecard;
  impact: ImpactEstimate;
  history: HistoryPoint[]; // includes this run as the last point
  competitors?: CompetitorScore[];
  cta?: CtaConfig;
}

// Deliberately excludes ai_visibility: it's optional on CategoryScores (only
// present when score() was called with a ProbeResult), and this report
// template doesn't render it yet — see README follow-up note. Typing this
// as the 5 always-present base keys (not keyof CategoryScores) keeps that
// exclusion enforced by the compiler, not just by convention.
type BaseCategoryKey = "schema" | "rendering" | "crawler_access" | "accessibility" | "extractability";

const CATEGORY_META: { key: BaseCategoryKey; label: string; max: number }[] = [
  { key: "schema", label: "Structured data (schema)", max: SCHEMA_MAX },
  { key: "rendering", label: "Rendering accessibility", max: RENDERING_MAX },
  { key: "crawler_access", label: "AI crawler access", max: CRAWLER_ACCESS_MAX },
  { key: "accessibility", label: "Accessibility tree", max: ACCESSIBILITY_MAX },
  { key: "extractability", label: "Content extractability", max: EXTRACTABILITY_MAX },
];

const EASE_META: Record<number, { label: string; className: string }> = {
  3: { label: "Quick win", className: "badge-good" },
  2: { label: "Moderate effort", className: "badge-warning" },
  1: { label: "Hard", className: "badge-critical" },
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function fmtMoney(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function scoreBadgeClass(score: number): string {
  if (score >= 70) return "badge-good";
  if (score >= 40) return "badge-warning";
  return "badge-critical";
}

function confidenceLabel(c: Findings["scan_confidence"]): string {
  return c === "high" ? "High confidence" : c === "medium" ? "Medium confidence" : "Low confidence";
}

function categoryBars(current: Scorecard, potential: Scorecard): string {
  return CATEGORY_META.map(({ key, label, max }) => {
    const cur = current.category_scores[key];
    const pot = potential.category_scores[key];
    const curPct = (cur / max) * 100;
    const potPct = (pot / max) * 100;
    return `
      <div class="bar-row">
        <div class="bar-row-label">${esc(label)}</div>
        <div class="bar-track-group">
          <div class="bar-track">
            <div class="bar-fill bar-current" style="width:${curPct}%" title="Current: ${cur}/${max} points"></div>
          </div>
          <div class="bar-track">
            <div class="bar-fill bar-potential" style="width:${potPct}%" title="Potential: ${pot}/${max} points"></div>
          </div>
        </div>
        <div class="bar-row-values">
          <span class="tabular">${cur}</span><span class="bar-row-max">/${max}</span>
          <span class="bar-row-arrow">→</span>
          <span class="tabular bar-row-potential-value">${pot}</span><span class="bar-row-max">/${max}</span>
        </div>
      </div>`;
  }).join("\n");
}

/**
 * ai_visibility gets its own row, not a slot in categoryBars' current-vs-
 * potential comparison: per the documented judgment call in
 * packages/scoring/src/rubric/aiVisibility.ts, there's no way to simulate
 * "what would ai_visibility be if fixed" the way the other five categories
 * can be projected from Findings alone — the only real path is closing
 * those five gaps and re-probing later to see if it moved. Showing a fake
 * "potential" bar here would be exactly the kind of fabricated precision
 * this whole project's guardrails exist to prevent.
 */
function aiVisibilityRow(current: Scorecard): string {
  const score = current.category_scores.ai_visibility;
  if (score === undefined) return "";
  const pct = (score / AI_VISIBILITY_MAX) * 100;
  return `
    <div class="bar-row bar-row-single">
      <div class="bar-row-label">AI visibility (real probe)</div>
      <div class="bar-track-group">
        <div class="bar-track">
          <div class="bar-fill bar-current" style="width:${pct}%" title="${score}/${AI_VISIBILITY_MAX} points"></div>
        </div>
      </div>
      <div class="bar-row-values">
        <span class="tabular">${score}</span><span class="bar-row-max">/${AI_VISIBILITY_MAX}</span>
        <span class="bar-row-note">no simulated potential — re-probe after fixes</span>
      </div>
    </div>`;
}

/**
 * Real competitor scores, ranked, with this business's own row highlighted.
 * This is social-proof-as-loss-aversion: "you're behind 6 of 9" is a
 * comparison a reader can't dismiss as sales copy, because it names real
 * businesses scored by the identical rubric. Renders nothing if no real
 * competitor data was supplied — no synthetic "average local competitor."
 */
function competitiveStandingSection(current: Scorecard, url: string, competitors: CompetitorScore[] | undefined): string {
  if (!competitors || competitors.length === 0) return "";

  const self: CompetitorScore = { name: "This business", url, total_score: current.total_score, total_score_max: current.total_score_max };
  const all = [...competitors, self].sort((a, b) => b.total_score / b.total_score_max - a.total_score / a.total_score_max);
  const rank = all.findIndex((c) => c.url === url) + 1;
  const behindCount = all.filter((c) => c.url !== url && c.total_score / c.total_score_max > current.total_score / current.total_score_max).length;

  const rows = all
    .map((c, i) => {
      const isSelf = c.url === url;
      const pct = Math.round((c.total_score / c.total_score_max) * 100);
      return `
        <tr class="${isSelf ? "rank-row-self" : ""}">
          <td class="tabular">${i + 1}</td>
          <td>${isSelf ? `<strong>${esc(c.name)} (this business)</strong>` : esc(c.name)}</td>
          <td class="tabular">${c.total_score}/${c.total_score_max}</td>
          <td class="tabular">${pct}%</td>
        </tr>`;
    })
    .join("\n");

  return `
    <section class="section">
      <h2>Where this business ranks locally</h2>
      <p class="section-sub">
        Real scores from ${competitors.length} other real local competitor site${competitors.length === 1 ? "" : "s"}, same rubric, same scan.
        ${behindCount > 0 ? `Currently ranked <strong>#${rank} of ${all.length}</strong> — behind ${behindCount} direct competitor${behindCount === 1 ? "" : "s"} in this market.` : `Currently ranked <strong>#${rank} of ${all.length}</strong> — ahead of the field today.`}
      </p>
      <div class="assumptions-table-wrap">
        <table class="assumptions-table rank-table">
          <thead><tr><th>Rank</th><th>Business</th><th>Score</th><th>%</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>`;
}

function probeResultsSection(probe: ProbeResult | undefined): string {
  if (!probe) return "";
  const pct = (probe.overall_mention_rate * 100).toFixed(0);
  const rows = probe.provider_summaries
    .map((s) => {
      const errored = probe.attempts.filter((a) => a.provider === s.provider && a.error !== null).length;
      const rate = (s.mention_rate * 100).toFixed(0);
      return `
        <tr>
          <td style="text-transform:capitalize">${esc(s.provider)}</td>
          <td class="tabular">${s.times_mentioned}/${s.queries_run}</td>
          <td class="tabular">${rate}%</td>
          <td class="tabular">${s.avg_mention_position ?? "—"}</td>
          <td class="tabular">${errored > 0 ? `${errored} failed` : "—"}</td>
        </tr>`;
    })
    .join("\n");

  const competitorCounts = new Map<string, number>();
  for (const a of probe.attempts) {
    for (const c of a.competitors_mentioned) {
      competitorCounts.set(c, (competitorCounts.get(c) ?? 0) + 1);
    }
  }
  const topCompetitors = [...competitorCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return `
    <section class="section">
      <h2>AI visibility — real probe results</h2>
      <p class="section-sub">
        ${esc(probe.business.name)} was mentioned in <span class="tabular">${pct}%</span> of
        ${probe.attempts.length} real queries sent to ChatGPT, Claude, Gemini, and Perplexity
        (probe confidence: ${probe.probe_confidence}${probe.probe_issues.length > 0 ? `, ${probe.probe_issues.length} provider call(s) failed — see below` : ""}).
      </p>
      <div class="assumptions-table-wrap">
        <table class="assumptions-table">
          <thead>
            <tr><th>Provider</th><th>Mentioned</th><th>Rate</th><th>Avg. position</th><th>Errors</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${
        topCompetitors.length > 0
          ? `<p class="section-sub" style="margin-top:16px;margin-bottom:0;">Competitors named instead: ${topCompetitors.map(([name, n]) => `${esc(name)} (${n}×)`).join(", ")}</p>`
          : ""
      }
      ${
        probe.probe_issues.length > 0
          ? `<div class="disclaimer" style="margin-top:16px;"><span>⚠</span><span><strong>${probe.probe_issues.length} call(s) failed</strong> — usually AI Gateway free-tier rate limiting, not a real "not mentioned" signal. probe_confidence (${probe.probe_confidence}) already reflects this; treat this run's numbers as directional, not final, until a cleaner re-probe is available.</span></div>`
          : ""
      }
    </section>`;
}

/**
 * Opens the report with the single sharpest real finding, not the score.
 * Specificity is what makes a diagnostic read as credible rather than
 * templated ("your telephone field is missing from LocalBusiness schema"
 * lands harder than "your SEO could improve") — and stating it as a
 * present-tense, ongoing condition ("AI assistants can't currently verify
 * your phone number") is loss-aversion framing applied honestly: it's not
 * inventing a future threat, it's naming what's already true today.
 * Pulled from the real #1-ranked top_fixes entry — no separate judgment call.
 */
function hookSection(current: Scorecard, probe: ProbeResult | undefined): string {
  const worst = current.top_fixes[0];
  const namedCompetitor = probe?.attempts.flatMap((a) => a.competitors_mentioned)[0];

  if (!worst && !namedCompetitor) {
    return `
    <section class="hook hook-neutral">
      <p class="hook-eyebrow">Diagnostic summary</p>
      <p class="hook-line">No critical gaps found — this scan didn't surface a single dominant issue to lead with.</p>
    </section>`;
  }

  const lines: string[] = [];
  if (namedCompetitor) {
    lines.push(
      `When AI assistants were asked a real local-search question, <strong>${esc(namedCompetitor)}</strong> was named instead of this business.`,
    );
  }
  if (worst) {
    lines.push(
      `Right now: <strong>${esc(worst.description)}</strong> — a real, currently-open gap worth ${worst.points_recoverable} of the ${current.total_score_max} rubric points, unaddressed as of this scan.`,
    );
  }

  return `
    <section class="hook">
      <p class="hook-eyebrow">What's happening right now</p>
      ${lines.map((l) => `<p class="hook-line">${l}</p>`).join("\n")}
    </section>`;
}

function scoreRing(score: number, max: number, label: string, colorVar: string): string {
  const r = 54;
  const circumference = 2 * Math.PI * r;
  // Bug fixed here: this used to divide by a hardcoded 100, which drew a
  // visually wrong ring (e.g. 90/120 rendered as if it were 90%) as soon as
  // an AI-Probe result extended the ceiling to 120. Always ratio against
  // the real max for this specific Scorecard.
  const offset = circumference * (1 - score / max);
  return `
    <div class="ring-wrap">
      <svg viewBox="0 0 128 128" class="ring-svg" role="img" aria-label="${esc(label)}: ${score} out of ${max}">
        <circle cx="64" cy="64" r="${r}" class="ring-track" />
        <circle cx="64" cy="64" r="${r}" class="ring-fill" style="stroke:${colorVar};stroke-dasharray:${circumference};stroke-dashoffset:${offset}" />
      </svg>
      <div class="ring-center">
        <div class="ring-score tabular">${score}</div>
        <div class="ring-of">/${max}</div>
      </div>
    </div>`;
}

function trendSparkline(history: HistoryPoint[]): string {
  if (history.length < 2) return "";
  const w = 640;
  const h = 120;
  const pad = 16;
  const scores = history.map((p) => p.total_score);
  const min = Math.max(0, Math.min(...scores) - 5);
  const max = Math.min(100, Math.max(...scores) + 5);
  const range = Math.max(1, max - min);
  const stepX = (w - pad * 2) / (history.length - 1);
  const points = history.map((p, i) => {
    const x = pad + i * stepX;
    const y = h - pad - ((p.total_score - min) / range) * (h - pad * 2);
    return { x, y, p };
  });
  const path = points.map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(" ");
  const areaPath = `${path} L${points[points.length - 1].x.toFixed(1)},${h - pad} L${points[0].x.toFixed(1)},${h - pad} Z`;
  const last = points[points.length - 1];
  const dots = points
    .map(
      (pt, i) =>
        `<circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="${i === points.length - 1 ? 4 : 2.5}" class="${i === points.length - 1 ? "trend-dot-current" : "trend-dot"}"><title>${fmtDate(pt.p.timestamp)}: ${pt.p.total_score}/${pt.p.total_score_max}</title></circle>`,
    )
    .join("");
  return `
    <section class="section">
      <h2>Score over time</h2>
      <p class="section-sub">${history.length} scans on record for this URL, oldest to newest.</p>
      <svg viewBox="0 0 ${w} ${h}" class="trend-svg" role="img" aria-label="Score trend over ${history.length} scans">
        <line x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}" class="trend-baseline" />
        <path d="${areaPath}" class="trend-area" />
        <path d="${path}" class="trend-line" />
        ${dots}
        <text x="${last.x.toFixed(1)}" y="${(last.y - 12).toFixed(1)}" class="trend-label tabular" text-anchor="end">${last.p.total_score}</text>
      </svg>
    </section>`;
}

function topFixesList(scorecard: Scorecard): string {
  if (scorecard.top_fixes.length === 0) {
    return `<p class="section-sub">No outstanding fixes — this page is already scoring well against the rubric.</p>`;
  }
  return `
    <ol class="fix-list">
      ${scorecard.top_fixes
        .map((fix, i) => {
          const ease = EASE_META[fix.ease] ?? EASE_META[2];
          return `
        <li class="fix-item">
          <div class="fix-rank tabular">${i + 1}</div>
          <div class="fix-body">
            <div class="fix-desc">${esc(fix.description)}</div>
            <div class="fix-meta">
              <span class="badge ${ease.className}">${ease.label}</span>
              <span class="fix-category">${esc(fix.category.replace(/_/g, " "))}</span>
            </div>
          </div>
          <div class="fix-points tabular">+${fix.points_recoverable}<span class="fix-points-unit">pts</span></div>
        </li>`;
        })
        .join("\n")}
    </ol>`;
}

/**
 * The "what you could achieve" contrast panel — deliberately placed after
 * the loss-framed sections (hook, competitive standing, cost-of-inaction)
 * and before the fix list. Loss aversion opens the gap; this section shows
 * the reader a concrete, rubric-grounded destination before handing them
 * the fix list as the literal path there — turns dread into a plan.
 */
function visionSection(current: Scorecard, potential: Scorecard, impact: ImpactEstimate): string {
  const gain = potential.total_score - current.total_score;
  return `
    <section class="section vision-section">
      <h2>What "fixed" looks like</h2>
      <p class="section-sub">Every number below is this same rubric, this same scan — just with the detected gaps closed.</p>
      <div class="vision-grid">
        <div class="vision-figure">
          <div class="vision-figure-label">Score</div>
          <div class="vision-figure-value">${current.total_score} <span class="vision-arrow">→</span> <span class="vision-target">${potential.total_score}</span><span class="vision-unit">/${potential.total_score_max}</span></div>
        </div>
        <div class="vision-figure">
          <div class="vision-figure-label">Points recovered</div>
          <div class="vision-figure-value vision-gain">+${gain}</div>
        </div>
        <div class="vision-figure">
          <div class="vision-figure-label">Additional captured value / month</div>
          <div class="vision-figure-value vision-gain">${fmtMoney(impact.wastedMonthlyValue)}</div>
        </div>
      </div>
    </section>`;
}

/**
 * Closing CTA. Urgency copy ("N slots left this ___") only renders when the
 * caller supplies a real remainingSlots/slotsPeriod — omitting cta entirely,
 * or omitting just those two fields, drops the urgency line rather than
 * inventing scarcity. This is the one place fabrication would be easiest
 * and most damaging to credibility, so it's the most tightly gated.
 */
function ctaSection(cta: CtaConfig | undefined): string {
  if (!cta) {
    return `
    <section class="cta-panel">
      <h2 class="cta-title">Want this fixed?</h2>
      <p class="cta-sub">Reply to this report and we'll walk through the fix list together.</p>
    </section>`;
  }
  const hasUrgency = cta.remainingSlots !== undefined && cta.slotsPeriod;
  return `
    <section class="cta-panel">
      ${hasUrgency ? `<p class="cta-urgency">Only ${cta.remainingSlots} spot${cta.remainingSlots === 1 ? "" : "s"} open ${esc(cta.slotsPeriod!)}</p>` : ""}
      <h2 class="cta-title">${esc(cta.offerLabel)}</h2>
      <p class="cta-sub">The fix list above is ranked and ready — quickest wins first. This is the concrete next step to start closing the gap.</p>
      <a class="cta-button" href="${esc(cta.contactHref)}">${esc(cta.contactLabel)}</a>
    </section>`;
}

export function buildReportBody(data: ReportData): string {
  const { url, findings, current, potential, impact, history, competitors, cta } = data;
  const gap = potential.total_score - current.total_score;

  return `
<style>
  :root {
    --paper: #faf8f4;
    --ink: #14181f;
    --ink-muted: #4f5661;
    --surface: #f1eee7;
    --surface-2: #e8e4da;
    --border: #dad7d0;
    --accent-current: #0891b2;
    --accent-potential: #7c3aed;
    --status-good: #0d9488;
    --status-warning: #ca8a04;
    --status-critical: #e11d48;
    --status-good-bg: color-mix(in oklab, var(--status-good) 14%, var(--paper));
    --status-warning-bg: color-mix(in oklab, var(--status-warning) 14%, var(--paper));
    --status-critical-bg: color-mix(in oklab, var(--status-critical) 14%, var(--paper));
    --font-display: "Iowan Old Style", "Palatino Linotype", Georgia, ui-serif, serif;
    --font-body: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    --font-mono: ui-monospace, "SF Mono", "Cascadia Code", Consolas, monospace;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --paper: #14181f;
      --ink: #f4f1ea;
      --ink-muted: #a8adb8;
      --surface: #1c212b;
      --surface-2: #242a36;
      --border: #2c3340;
      --status-warning: #bf8300;
      --status-good-bg: color-mix(in oklab, var(--status-good) 20%, var(--paper));
      --status-warning-bg: color-mix(in oklab, var(--status-warning) 20%, var(--paper));
      --status-critical-bg: color-mix(in oklab, var(--status-critical) 20%, var(--paper));
    }
  }
  :root[data-theme="dark"] {
    --paper: #14181f;
    --ink: #f4f1ea;
    --ink-muted: #a8adb8;
    --surface: #1c212b;
    --surface-2: #242a36;
    --border: #2c3340;
    --status-warning: #bf8300;
    --status-good-bg: color-mix(in oklab, var(--status-good) 20%, var(--paper));
    --status-warning-bg: color-mix(in oklab, var(--status-warning) 20%, var(--paper));
    --status-critical-bg: color-mix(in oklab, var(--status-critical) 20%, var(--paper));
  }

  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--paper);
    color: var(--ink);
    font-family: var(--font-body);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
  .report {
    max-width: 880px;
    margin: 0 auto;
    padding: clamp(24px, 5vw, 64px) clamp(20px, 4vw, 32px) 80px;
  }
  .tabular { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }

  /* Masthead */
  .masthead {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 40px;
    flex-wrap: wrap;
  }
  .masthead-eyebrow {
    font-size: 0.72rem;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--ink-muted);
    margin: 0 0 6px;
  }
  .masthead-url {
    font-family: var(--font-display);
    font-size: clamp(1.5rem, 3.5vw, 2.1rem);
    margin: 0;
    text-wrap: balance;
    word-break: break-word;
  }
  .masthead-meta {
    text-align: right;
    font-size: 0.85rem;
    color: var(--ink-muted);
  }
  .masthead-meta .tabular { color: var(--ink); }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 100px;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  .badge-good { background: var(--status-good-bg); color: var(--status-good); }
  .badge-warning { background: var(--status-warning-bg); color: var(--status-warning); }
  .badge-critical { background: var(--status-critical-bg); color: var(--status-critical); }

  /* Hero */
  .hero {
    display: flex;
    align-items: center;
    gap: clamp(24px, 5vw, 56px);
    padding: 32px 0 44px;
    flex-wrap: wrap;
  }
  .ring-wrap { position: relative; width: 128px; height: 128px; flex-shrink: 0; }
  .ring-svg { width: 128px; height: 128px; transform: rotate(-90deg); }
  .ring-track { fill: none; stroke: var(--surface-2); stroke-width: 10; }
  .ring-fill { fill: none; stroke-width: 10; stroke-linecap: round; transition: stroke-dashoffset 0.6s ease; }
  .ring-center {
    position: absolute; inset: 0; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
  }
  .ring-score { font-size: 2.1rem; font-weight: 700; line-height: 1; }
  .ring-of { font-size: 0.78rem; color: var(--ink-muted); margin-top: 2px; }
  .hero-text { flex: 1; min-width: 240px; }
  .hero-headline {
    font-family: var(--font-display);
    font-size: clamp(1.3rem, 3vw, 1.6rem);
    margin: 0 0 10px;
    text-wrap: balance;
  }
  .hero-sub { color: var(--ink-muted); margin: 0; font-size: 0.95rem; }
  .hero-gap {
    display: inline-flex; align-items: baseline; gap: 6px; margin-top: 14px;
    font-size: 0.9rem;
  }
  .hero-gap .tabular { color: var(--accent-potential); font-weight: 700; font-size: 1.05rem; }

  /* Sections */
  .section { padding: 36px 0; border-top: 1px solid var(--border); }
  .section h2 {
    font-family: var(--font-display);
    font-size: 1.3rem;
    margin: 0 0 6px;
  }
  .section-sub { color: var(--ink-muted); font-size: 0.9rem; margin: 0 0 24px; }

  /* Legend */
  .legend { display: flex; gap: 20px; margin-bottom: 20px; font-size: 0.85rem; }
  .legend-item { display: flex; align-items: center; gap: 7px; }
  .legend-swatch { width: 10px; height: 10px; border-radius: 3px; }
  .legend-swatch.current { background: var(--accent-current); }
  .legend-swatch.potential { background: var(--accent-potential); }

  /* Category bars */
  .bar-row { display: grid; grid-template-columns: 200px 1fr 140px; gap: 14px; align-items: center; padding: 10px 0; }
  .bar-row-label { font-size: 0.88rem; }
  .bar-track-group { display: flex; flex-direction: column; gap: 3px; }
  .bar-track { height: 8px; background: var(--surface-2); border-radius: 4px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 4px; }
  .bar-current { background: var(--accent-current); }
  .bar-potential { background: var(--accent-potential); opacity: 0.85; }
  .bar-row-values { font-size: 0.82rem; text-align: right; color: var(--ink-muted); white-space: nowrap; }
  .bar-row-values .tabular { color: var(--ink); font-weight: 600; }
  .bar-row-potential-value { color: var(--accent-potential) !important; }
  .bar-row-max { color: var(--ink-muted); }
  .bar-row-arrow { margin: 0 4px; color: var(--ink-muted); }

  /* Top fixes */
  .fix-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
  .fix-item {
    display: grid; grid-template-columns: 28px 1fr auto; gap: 16px; align-items: center;
    padding: 14px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
  }
  .fix-rank { color: var(--ink-muted); font-size: 0.85rem; }
  .fix-desc { font-size: 0.92rem; margin-bottom: 6px; }
  .fix-meta { display: flex; align-items: center; gap: 10px; }
  .fix-category { font-size: 0.78rem; color: var(--ink-muted); text-transform: capitalize; }
  .fix-points { font-size: 1rem; font-weight: 700; color: var(--accent-potential); white-space: nowrap; }
  .fix-points-unit { font-size: 0.7rem; font-weight: 500; color: var(--ink-muted); margin-left: 2px; }

  /* Trend */
  .trend-svg { width: 100%; height: auto; }
  .trend-baseline { stroke: var(--border); stroke-width: 1; }
  .trend-area { fill: color-mix(in oklab, var(--accent-current) 14%, transparent); stroke: none; }
  .trend-line { fill: none; stroke: var(--accent-current); stroke-width: 2; }
  .trend-dot { fill: var(--paper); stroke: var(--accent-current); stroke-width: 1.5; }
  .trend-dot-current { fill: var(--accent-current); }
  .trend-label { fill: var(--ink); font-size: 13px; font-weight: 700; }

  /* Impact panel */
  .impact-panel {
    margin-top: 40px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: clamp(24px, 4vw, 40px);
  }
  .impact-eyebrow {
    font-size: 0.72rem; letter-spacing: 0.09em; text-transform: uppercase;
    color: var(--ink-muted); margin: 0 0 8px;
  }
  .impact-title { font-family: var(--font-display); font-size: 1.5rem; margin: 0 0 6px; text-wrap: balance; }
  .impact-sub { color: var(--ink-muted); font-size: 0.9rem; margin: 0 0 28px; max-width: 60ch; }
  .impact-figures {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 20px; margin-bottom: 28px;
  }
  .impact-figure { }
  .impact-figure-label { font-size: 0.78rem; color: var(--ink-muted); margin-bottom: 4px; }
  .impact-figure-value { font-family: var(--font-mono); font-size: 1.7rem; font-weight: 700; font-variant-numeric: tabular-nums; }
  .impact-figure-value.waste { color: var(--status-critical); }
  .impact-figure-value.gain { color: var(--status-good); }

  .assumptions-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-bottom: 20px; }
  .assumptions-table th, .assumptions-table td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--border); }
  .assumptions-table th { font-weight: 600; color: var(--ink-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.03em; }
  .assumptions-table td.tabular { text-align: right; }
  .assumptions-table-wrap { overflow-x: auto; }

  .disclaimer {
    display: flex; gap: 10px; padding: 14px 16px; background: var(--paper);
    border: 1px dashed var(--border); border-radius: 10px; font-size: 0.82rem; color: var(--ink-muted);
  }
  .disclaimer strong { color: var(--ink); }

  .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid var(--border); font-size: 0.78rem; color: var(--ink-muted); }

  .bar-row-single .bar-track-group { flex-direction: row; }
  .bar-row-note { display: block; font-size: 0.72rem; margin-top: 2px; color: var(--ink-muted); }

  /* Hook */
  .hook {
    margin: 8px 0 0;
    padding: 20px 24px;
    background: var(--status-critical-bg);
    border: 1px solid color-mix(in oklab, var(--status-critical) 35%, var(--border));
    border-radius: 14px;
  }
  .hook-neutral { background: var(--surface); border-color: var(--border); }
  .hook-eyebrow {
    font-size: 0.72rem; letter-spacing: 0.09em; text-transform: uppercase;
    color: var(--status-critical); font-weight: 700; margin: 0 0 8px;
  }
  .hook-neutral .hook-eyebrow { color: var(--ink-muted); }
  .hook-line { margin: 0 0 6px; font-size: 1.02rem; line-height: 1.45; }
  .hook-line:last-child { margin-bottom: 0; }
  .hook-line strong { font-weight: 700; }

  /* Rank table */
  .rank-table th, .rank-table td { text-align: left; }
  .rank-table td.tabular, .rank-table th:nth-child(1) { text-align: left; }
  .rank-row-self { background: color-mix(in oklab, var(--accent-current) 10%, transparent); }
  .rank-row-self td { font-weight: 600; }

  /* Vision panel */
  .vision-section { border-top: 1px solid var(--border); }
  .vision-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px;
  }
  .vision-figure-label { font-size: 0.78rem; color: var(--ink-muted); margin-bottom: 4px; }
  .vision-figure-value {
    font-family: var(--font-mono); font-size: 1.6rem; font-weight: 700; font-variant-numeric: tabular-nums;
  }
  .vision-arrow { color: var(--ink-muted); font-weight: 400; margin: 0 2px; }
  .vision-target { color: var(--status-good); }
  .vision-unit { font-size: 1rem; color: var(--ink-muted); }
  .vision-gain { color: var(--status-good); }

  /* CTA panel */
  .cta-panel {
    margin-top: 40px;
    padding: clamp(28px, 5vw, 48px);
    background: var(--ink);
    color: var(--paper);
    border-radius: 16px;
    text-align: center;
  }
  .cta-urgency {
    display: inline-block; margin: 0 0 14px; padding: 5px 14px; border-radius: 100px;
    background: var(--status-critical); color: white; font-size: 0.78rem; font-weight: 700;
    letter-spacing: 0.02em; text-transform: uppercase;
  }
  .cta-title { font-family: var(--font-display); font-size: 1.6rem; margin: 0 0 10px; color: var(--paper); }
  .cta-sub { color: color-mix(in oklab, var(--paper) 70%, transparent); max-width: 50ch; margin: 0 auto 26px; font-size: 0.95rem; }
  .cta-button {
    display: inline-block; padding: 14px 32px; background: var(--paper); color: var(--ink);
    border-radius: 100px; font-weight: 700; text-decoration: none; font-size: 0.95rem;
  }

  @media (max-width: 620px) {
    .bar-row { grid-template-columns: 1fr; gap: 6px; }
    .bar-row-values { text-align: left; }
  }
</style>

<div class="report">
  <header class="masthead">
    <div>
      <p class="masthead-eyebrow">AI Visibility Audit</p>
      <h1 class="masthead-url">${esc(url)}</h1>
    </div>
    <div class="masthead-meta">
      <div>Scanned <span class="tabular">${fmtDate(findings.scanned_at)}</span></div>
      <div style="margin-top:6px;"><span class="badge ${current.scan_confidence === "high" ? "badge-good" : current.scan_confidence === "medium" ? "badge-warning" : "badge-critical"}">${confidenceLabel(current.scan_confidence)}</span></div>
    </div>
  </header>

  ${hookSection(current, current.raw_probe)}

  <section class="hero">
    ${scoreRing(current.total_score, current.total_score_max, "Current AI visibility score", "var(--accent-current)")}
    <div class="hero-text">
      <p class="hero-headline">Scoring <span class="tabular">${current.total_score}</span> of <span class="tabular">${current.total_score_max}</span> on AI visibility today.</p>
      <p class="hero-sub">Measures how easily an AI answer engine (ChatGPT, Claude, Perplexity, Google AI Overviews) can find, trust, and cite this page — structured data, crawler access, rendering, accessibility, plain-text extractability${current.raw_probe ? ", and real AI-probe results" : ""}.</p>
      <div class="hero-gap">
        ${current.total_score_max - current.total_score} of ${current.total_score_max} possible points are currently unclaimed — <span class="tabular">${gap}</span> of them recoverable from flaws this scan already found.
      </div>
    </div>
  </section>

  ${competitiveStandingSection(current, url, competitors)}

  ${probeResultsSection(current.raw_probe)}

  <section class="impact-panel">
    <p class="impact-eyebrow">Business impact projection</p>
    <h2 class="impact-title">What this gap is estimated to be costing, every month it stays open</h2>
    <p class="impact-sub">
      This is a scenario model, not a measurement — no tool can observe how many AI-driven
      customers a business actually loses. The figures below follow directly from the
      assumptions in the table beneath them; replace those assumptions with this business's
      real numbers before treating the dollar figures as anything more than illustrative.
    </p>

    <div class="impact-figures">
      <div class="impact-figure">
        <div class="impact-figure-label">Wasted / month, right now</div>
        <div class="impact-figure-value waste">${fmtMoney(impact.wastedMonthlyValue)}</div>
      </div>
      <div class="impact-figure">
        <div class="impact-figure-label">Wasted / year at this rate</div>
        <div class="impact-figure-value waste">${fmtMoney(impact.wastedAnnualValue)}</div>
      </div>
      <div class="impact-figure">
        <div class="impact-figure-label">Wasted over ${impact.assumptions.projectionYears} years if unfixed</div>
        <div class="impact-figure-value waste">${fmtMoney(impact.wastedProjectedValue)}</div>
      </div>
      <div class="impact-figure">
        <div class="impact-figure-label">Captured value / month (today)</div>
        <div class="impact-figure-value">${fmtMoney(impact.currentMonthlyValue)}</div>
      </div>
      <div class="impact-figure">
        <div class="impact-figure-label">Achievable value / month (fixed)</div>
        <div class="impact-figure-value gain">${fmtMoney(impact.potentialMonthlyValue)}</div>
      </div>
    </div>

    <div class="assumptions-table-wrap">
      <table class="assumptions-table">
        <thead>
          <tr><th>Assumption</th><th style="text-align:right">Value</th></tr>
        </thead>
        <tbody>
          <tr><td>Estimated monthly AI-referable queries</td><td class="tabular">${impact.assumptions.estimatedMonthlyAiReferrals.toLocaleString("en-US")}</td></tr>
          <tr><td>Baseline conversion rate (referral → customer action)</td><td class="tabular">${(impact.assumptions.baselineConversionRate * 100).toFixed(1)}%</td></tr>
          <tr><td>Average value per converted customer</td><td class="tabular">${fmtMoney(impact.assumptions.avgCustomerValue)}</td></tr>
          <tr><td>Capture-rate model</td><td class="tabular">score ÷ 100</td></tr>
          <tr><td>Current capture rate</td><td class="tabular">${(impact.currentCaptureRate * 100).toFixed(0)}%</td></tr>
          <tr><td>Potential capture rate</td><td class="tabular">${(impact.potentialCaptureRate * 100).toFixed(0)}%</td></tr>
        </tbody>
      </table>
    </div>

    <div class="disclaimer">
      <span>⚠</span>
      <span><strong>Not a measurement.</strong> "Capture rate = score ÷ 100" is a simplifying assumption, not a validated conversion model. Swap in this business's real AI-referral volume, conversion rate, and customer value to make this section trustworthy for a client presentation.</span>
    </div>
  </section>

  <section class="section">
    <h2>Current vs. potential, by category</h2>
    <p class="section-sub">What this page scores today against what the same rubric would award if every detected gap were closed.</p>
    <div class="legend">
      <span class="legend-item"><span class="legend-swatch current"></span>Current</span>
      <span class="legend-item"><span class="legend-swatch potential"></span>Potential (flaws fixed)</span>
    </div>
    ${categoryBars(current, potential)}
    ${aiVisibilityRow(current)}
  </section>

  ${visionSection(current, potential, impact)}

  <section class="section">
    <h2>The roadmap to close the gap</h2>
    <p class="section-sub">Ranked by points recoverable × ease of implementation — quick wins surface first, so the first item here is the fastest real progress available.</p>
    ${topFixesList(current)}
  </section>

  ${trendSparkline(history)}

  ${ctaSection(cta)}

  <footer class="footer">
    Generated by the Scanner + Scoring${current.raw_probe ? " + AI-Probe" : ""} pipeline · scan confidence: ${current.scan_confidence} ·
    ${findings.scan_issues.length > 0 ? `${findings.scan_issues.length} scan issue(s) logged` : "no scan issues"}
  </footer>
</div>`;
}

export function buildStandaloneHtml(data: ReportData): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>AI Visibility Audit — ${esc(data.url)}</title>
</head>
<body>
${buildReportBody(data)}
</body>
</html>`;
}
