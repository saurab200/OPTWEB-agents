import type { Page } from "playwright";
import type { ContentExtractabilityFindings } from "@aiv/contracts";
import { countWords } from "./rendering.js";

// Heuristic regexes for "can an LLM lift this fact straight out of plain
// text, with no schema and no DOM parsing." Documented judgment calls —
// tuned for readability over precision-recall rigor.
const PHONE_RE = /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/;
const ADDRESS_RE =
  /\d{1,5}\s+[A-Za-z0-9.'-]+(\s[A-Za-z0-9.'-]+){0,4}\s+(street|st|avenue|ave|road|rd|blvd|boulevard|drive|dr|lane|ln|way|court|ct|suite|ste|highway|hwy)\b/i;
const HOURS_RE =
  /(mon|tue|wed|thu|fri|sat|sun)[a-z]*.{0,25}\d{1,2}(:\d{2})?\s?(am|pm)|\b(open|hours)\b.{0,25}\d{1,2}(:\d{2})?\s?(am|pm)/i;
const SERVICES_RE = /\b(our services|services offered|services include|we offer|what we do)\b/i;

export function detectPhone(text: string): boolean {
  return PHONE_RE.test(text);
}

export function detectAddress(text: string): boolean {
  return ADDRESS_RE.test(text);
}

export function detectHours(text: string): boolean {
  return HOURS_RE.test(text);
}

export function detectServices(text: string): boolean {
  return SERVICES_RE.test(text);
}

export function computeAvgParagraphWordCount(paragraphs: string[]): number {
  const nonEmpty = paragraphs.map((p) => p.trim()).filter((p) => p.length > 0);
  if (nonEmpty.length === 0) return 0;
  const total = nonEmpty.reduce((sum, p) => sum + countWords(p), 0);
  return Math.round((total / nonEmpty.length) * 100) / 100;
}

interface StructuralSignals {
  paragraphs: string[];
  qaBlocks: number;
  plainText: string;
}

async function getStructuralSignals(page: Page): Promise<StructuralSignals> {
  return page.evaluate(() => {
    const paragraphs = Array.from(document.querySelectorAll("p")).map(
      (p) => (p as HTMLElement).innerText ?? "",
    );

    // dt/dd definition-list pairs are a common accessible Q&A pattern.
    const dtCount = document.querySelectorAll("dt").length;
    const ddCount = document.querySelectorAll("dd").length;
    const dlPairs = Math.min(dtCount, ddCount);

    // Headings phrased as a question, immediately followed by body text,
    // are the other common on-page FAQ pattern (outside JSON-LD FAQPage).
    const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6"));
    let questionHeadingBlocks = 0;
    for (const h of headings) {
      const text = (h as HTMLElement).innerText ?? "";
      if (text.trim().endsWith("?")) {
        const next = h.nextElementSibling;
        if (next && (next.textContent ?? "").trim().length > 0) {
          questionHeadingBlocks += 1;
        }
      }
    }

    const plainText = document.body?.innerText ?? "";
    return { paragraphs, qaBlocks: dlPairs + questionHeadingBlocks, plainText };
  });
}

export async function extractContentExtractability(
  page: Page,
  issues: string[],
): Promise<ContentExtractabilityFindings> {
  let signals: StructuralSignals = { paragraphs: [], qaBlocks: 0, plainText: "" };
  try {
    signals = await getStructuralSignals(page);
  } catch (err) {
    issues.push(
      `Content extractability signals failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  return {
    avg_paragraph_word_count: computeAvgParagraphWordCount(signals.paragraphs),
    qa_formatted_blocks: signals.qaBlocks,
    key_facts_in_plain_text: {
      hours: detectHours(signals.plainText),
      address: detectAddress(signals.plainText),
      phone: detectPhone(signals.plainText),
      services: detectServices(signals.plainText),
    },
  };
}
