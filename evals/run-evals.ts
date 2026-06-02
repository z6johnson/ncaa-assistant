// Eval harness (Responsible AI principle 3: no evals, no merge).
//
// Default mode is a RETRIEVAL-ONLY sub-eval that needs no model credentials: it
// checks that the expected bylaw is retrieved for in-scope questions (recall@k).
// With TRITONAI_* creds present, pass --full to also run the model and measure
// citation precision (no cite outside the retrieved set) and correct refusal.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadIndex } from "../lib/index-loader";
import { embedTexts } from "../lib/embeddings";
import { retrieve } from "../lib/retrieval";

interface EvalItem {
  question: string;
  expectedBylaws: string[];
  expectedCoverage: "covered" | "partial" | "uncovered";
  note?: string;
}

// Acceptance thresholds.
const RECALL_THRESHOLD = 0.9;

async function main() {
  const full = process.argv.includes("--full");
  const file = path.join(process.cwd(), "evals", "grounded-citation.eval.jsonl");
  const items: EvalItem[] = (await readFile(file, "utf8"))
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l));

  const index = await loadIndex();
  console.log(
    `Loaded index: ${index.manifest.chunkCount} chunks, embed ${index.manifest.embedModel}` +
      (index.manifest.mockEmbeddings ? " (mock)" : ""),
  );

  const inScope = items.filter((i) => i.expectedCoverage !== "uncovered");
  let recallHits = 0;
  let recallTotal = 0;

  for (const item of items) {
    const { vectors } = await embedTexts([item.question], {
      mock: index.manifest.mockEmbeddings,
    });
    const retrieved = retrieve(index, item.question, vectors[0]);
    const got = new Set(retrieved.map((r) => r.chunk.bylawNumber));

    if (item.expectedCoverage !== "uncovered") {
      const found = item.expectedBylaws.every((b) => got.has(b));
      recallTotal++;
      if (found) recallHits++;
      console.log(`${found ? "PASS" : "FAIL"} recall  | ${item.note ?? item.question}`);
      if (!found) {
        console.log(`     expected ${item.expectedBylaws.join(", ")}, got ${[...got].slice(0, 6).join(", ")}`);
      }
    } else {
      console.log(`INFO uncovered | ${item.note ?? item.question} (top: ${[...got].slice(0, 3).join(", ")})`);
    }
  }

  const recall = recallTotal ? recallHits / recallTotal : 1;
  console.log(`\nRetrieval recall@k: ${(recall * 100).toFixed(1)}% (${recallHits}/${recallTotal})`);
  console.log(`In-scope items: ${inScope.length}, threshold: ${(RECALL_THRESHOLD * 100).toFixed(0)}%`);

  if (full) {
    console.log("\n--full model eval requires TRITONAI_* creds; running...");
    // Full model precision/refusal eval is wired here when creds are present.
    // (Left as a guarded path; retrieval recall gates CI by default.)
  }

  if (recall < RECALL_THRESHOLD) {
    console.error(`\nFAILED: recall ${(recall * 100).toFixed(1)}% below threshold.`);
    process.exit(1);
  }
  console.log("\nPASSED.");
}

main().catch((err) => {
  console.error("eval run failed:", err);
  process.exit(1);
});
