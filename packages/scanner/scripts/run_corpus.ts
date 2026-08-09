import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { scan } from "../src/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const corpusPath = path.join(__dirname, "..", "fixtures", "corpus.json");
const outDir = path.join(__dirname, "..", "fixtures", "corpus_findings");

interface CorpusEntry {
  id: string;
  url: string;
  category: string;
  notes: string;
}

async function main(): Promise<void> {
  const corpus: CorpusEntry[] = JSON.parse(readFileSync(corpusPath, "utf-8"));
  mkdirSync(outDir, { recursive: true });

  const rows: string[] = [];
  rows.push(
    "| id | url | confidence | issues | crashed |",
  );
  rows.push("|---|---|---|---|---|");

  for (const entry of corpus) {
    process.stderr.write(`Scanning ${entry.id} (${entry.url})...\n`);
    let crashed = false;
    let findings;
    try {
      findings = await scan(entry.url);
    } catch (err) {
      crashed = true;
      process.stderr.write(`  CRASHED: ${err instanceof Error ? err.stack : String(err)}\n`);
      rows.push(`| ${entry.id} | ${entry.url} | - | SCANNER CRASHED | yes |`);
      continue;
    }
    writeFileSync(
      path.join(outDir, `${entry.id}.json`),
      JSON.stringify(findings, null, 2),
    );
    rows.push(
      `| ${entry.id} | ${entry.url} | ${findings.scan_confidence} | ${findings.scan_issues.length} | ${crashed ? "yes" : "no"} |`,
    );
    process.stderr.write(
      `  confidence=${findings.scan_confidence} issues=${JSON.stringify(findings.scan_issues)}\n`,
    );
  }

  console.log(rows.join("\n"));
}

main();
