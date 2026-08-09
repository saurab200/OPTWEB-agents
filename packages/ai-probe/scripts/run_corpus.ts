import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { BusinessIdentity } from "@aiv/contracts";
import { probe } from "../src/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const corpusPath = path.join(__dirname, "..", "fixtures", "corpus.json");
const outDir = path.join(__dirname, "..", "fixtures", "probe_results");

function loadRepoEnvLocal(): void {
  const envPath = path.join(__dirname, "..", "..", "..", ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_]+)="?(.*?)"?$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadRepoEnvLocal();

interface CorpusEntry {
  id: string;
  business: BusinessIdentity;
  notes: string;
}

async function main(): Promise<void> {
  const corpus: CorpusEntry[] = JSON.parse(readFileSync(corpusPath, "utf-8"));
  mkdirSync(outDir, { recursive: true });

  const rows: string[] = ["| id | overall_mention_rate | confidence | issues |", "|---|---|---|---|"];

  for (const entry of corpus) {
    process.stderr.write(`Probing ${entry.id} (${entry.business.name})...\n`);
    const result = await probe(entry.business);
    writeFileSync(path.join(outDir, `${entry.id}.json`), JSON.stringify(result, null, 2));
    rows.push(
      `| ${entry.id} | ${result.overall_mention_rate} | ${result.probe_confidence} | ${result.probe_issues.length} |`,
    );
    process.stderr.write(
      `  mention_rate=${result.overall_mention_rate} confidence=${result.probe_confidence} issues=${result.probe_issues.length}\n`,
    );
  }

  console.log(rows.join("\n"));
}

main().catch((err: unknown) => {
  console.error("Corpus run failed:", err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
