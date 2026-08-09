import { describe, expect, it, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { scan } from "@aiv/scanner";
import { score } from "@aiv/scoring";

/**
 * End-to-end check that the Scanner Agent and Scoring Agent compose cleanly
 * through nothing but the Findings contract: scan(url) piped straight into
 * score(findings), against the full real corpus, live. Neither agent's
 * internals are touched here — this is the actual proof the split is clean.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const corpusPath = path.join(__dirname, "..", "..", "packages", "scanner", "fixtures", "corpus.json");

interface CorpusEntry {
  id: string;
  url: string;
  category: string;
  notes: string;
}

let corpus: CorpusEntry[] = [];

beforeAll(() => {
  corpus = JSON.parse(readFileSync(corpusPath, "utf-8"));
  expect(corpus.length).toBeGreaterThanOrEqual(8);
});

describe("pipeline: scan(url) -> score(findings) across the full live corpus", () => {
  it("runs end to end for every corpus URL without either agent crashing", async () => {
    for (const entry of corpus) {
      const findings = await scan(entry.url);
      expect(findings.url).toBeTruthy();
      expect(["high", "medium", "low"]).toContain(findings.scan_confidence);

      const scorecard = score(findings);
      expect(scorecard.total_score).toBeGreaterThanOrEqual(0);
      expect(scorecard.total_score).toBeLessThanOrEqual(100);
      expect(scorecard.scan_confidence).toBe(findings.scan_confidence);
      expect(scorecard.raw_findings).toEqual(findings);
      expect(scorecard.top_fixes.length).toBeLessThanOrEqual(3);
    }
  }, 600_000);
});
