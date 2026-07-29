/**
 * Generator entry point.
 * Builds 20 randomized EML files for each of the 5 required scenarios,
 * then validates every file with mailparser.
 *
 * Usage: npm run generate  (from the generator/ directory)
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { writeEML, type EmailParts } from "./build";
import { validateEML, type ValidationResult } from "./validate";
import { makePOData, computeTotal } from "./data";
import * as s01 from "./scenarios/scenario-01";
import * as s02 from "./scenarios/scenario-02";
import * as s03 from "./scenarios/scenario-03";
import * as s09 from "./scenarios/scenario-09";
import * as s10 from "./scenarios/scenario-10";

type GenerateFn = (po: ReturnType<typeof makePOData>) => Promise<EmailParts> | EmailParts;

const SCENARIOS: Record<string, GenerateFn> = {
  "scenario-01": s01.generate,
  "scenario-02": s02.generate,
  "scenario-03": s03.generate,
  "scenario-09": s09.generate,
  "scenario-10": s10.generate,
};

const CASES_PER_SCENARIO = 20;
const OUTPUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "output");

async function main() {
  console.log(`Generating ${CASES_PER_SCENARIO} cases × ${Object.keys(SCENARIOS).length} scenarios = ${CASES_PER_SCENARIO * Object.keys(SCENARIOS).length} EML files\n`);

  const allResults: ValidationResult[] = [];
  let totalFiles = 0;

  for (const [name, generateFn] of Object.entries(SCENARIOS)) {
    console.log(`\n── ${name} ──`);

    for (let i = 0; i < CASES_PER_SCENARIO; i++) {
      const po = makePOData();
      po.totalValue = computeTotal(po);

      const parts = await generateFn(po);
      const filepath = await writeEML(name, i, parts);
      const result = await validateEML(filepath);

      const status = result.ok ? "✓" : "✗";
      console.log(`  ${status} ${name}-${String(i).padStart(2, "0")}.eml  ${result.errors.length ? result.errors.join(", ") : "OK"}`);
      allResults.push(result);
      totalFiles++;
    }
  }

  // Summary
  const ok = allResults.filter((r) => r.ok).length;
  const bad = allResults.filter((r) => !r.ok).length;
  console.log(`\n\n${"─".repeat(40)}`);
  console.log(`Total: ${totalFiles} files | Pass: ${ok} | Fail: ${bad}`);

  // Write manifest
  const manifest = {
    generatedAt: new Date().toISOString(),
    total: totalFiles,
    pass: ok,
    fail: bad,
    results: allResults,
  };
  writeFileSync(
    join(OUTPUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf-8",
  );
  console.log(`Manifest written to output/manifest.json`);
}

main().catch(console.error);
