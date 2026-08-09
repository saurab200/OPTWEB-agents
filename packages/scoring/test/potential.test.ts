import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { Findings } from "@aiv/contracts";
import { score } from "../src/index.js";
import { projectPotentialFindings, projectPotentialScorecard } from "../src/rubric/potential.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const findingsDir = path.join(__dirname, "..", "fixtures", "findings");
const allIds = readdirSync(findingsDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""));

function load(id: string): Findings {
  return JSON.parse(readFileSync(path.join(findingsDir, `${id}.json`), "utf-8"));
}

describe("projectPotentialScorecard", () => {
  it.each(allIds)("%s: potential score is always the rubric ceiling of 100", (id) => {
    const potential = projectPotentialScorecard(load(id));
    expect(potential.total_score).toBe(100);
    expect(potential.category_scores).toEqual({
      schema: 35,
      rendering: 25,
      crawler_access: 15,
      accessibility: 15,
      extractability: 10,
    });
  });

  it.each(allIds)("%s: potential score is never lower than the current score", (id) => {
    const findings = load(id);
    const current = score(findings);
    const potential = projectPotentialScorecard(findings);
    expect(potential.total_score).toBeGreaterThanOrEqual(current.total_score);
  });

  it("preserves url and does not mutate the original Findings object", () => {
    const findings = load("partial-local-business-schema");
    const before = JSON.parse(JSON.stringify(findings));
    const projected = projectPotentialFindings(findings);
    expect(findings).toEqual(before); // untouched
    expect(projected.url).toBe(findings.url);
  });

  it("fills in missing LocalBusiness fields rather than discarding fields already present", () => {
    const findings = load("partial-local-business-schema");
    const projected = projectPotentialFindings(findings);
    for (const f of findings.schema.local_business.fields_present) {
      expect(projected.schema.local_business.fields_present).toContain(f);
    }
    expect(projected.schema.local_business.fields_missing).toHaveLength(0);
  });
});
