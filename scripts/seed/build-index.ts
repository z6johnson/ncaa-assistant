// Seed pipeline orchestrator. Produces the committed artifacts in data/:
//   index.meta.json   chunk text + metadata (git-diffable)
//   index.vectors.bin packed float32 embedding matrix
//   manifest.json     provenance (source, version hash, embed model, counts)
//
// Usage:
//   npm run seed                      build from MANUAL_SOURCE_URL (needs hub creds)
//   npm run seed -- --pdf manual.pdf  build from a locally downloaded PDF
//   npm run seed:mock                 build from the synthetic fixture, mock embeddings
//
// The real run requires the source host to be reachable and TRITONAI_* creds.

import { execSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fetchManual, extractCoverMeta } from "./fetch-manual";
import { parseManualText, qaCheck } from "./parse-bylaws";
import { enrich } from "./enrich";
import { embedChunks } from "./embed";
import { packVectors } from "../../lib/vectors";
import type { Manifest } from "../../lib/types";
import {
  SYNTHETIC_MANUAL_TEXT,
  SYNTHETIC_ACADEMIC_YEAR,
} from "./fixtures/synthetic-manual";

interface Args {
  source: "url" | "fixture";
  mock: boolean;
  pdfPath?: string;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { source: "url", mock: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--mock") args.mock = true;
    else if (a === "--source") args.source = argv[++i] === "fixture" ? "fixture" : "url";
    else if (a === "--pdf") args.pdfPath = argv[++i];
  }
  return args;
}

function gitCommit(): string | undefined {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return undefined;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dataDir = path.join(process.cwd(), "data");
  await mkdir(dataDir, { recursive: true });

  // 1. Source text + provenance.
  let text: string;
  let contentSha256: string;
  let retrievedAt: string;
  let sourceUrl: string;
  let cover: { manualTitle: string; academicYear: string; effectiveDate?: string };

  if (args.source === "fixture") {
    const { createHash } = await import("node:crypto");
    text = SYNTHETIC_MANUAL_TEXT;
    contentSha256 = createHash("sha256").update(text).digest("hex");
    retrievedAt = new Date().toISOString();
    sourceUrl = "fixture:synthetic-manual";
    cover = { manualTitle: "SYNTHETIC FIXTURE", academicYear: SYNTHETIC_ACADEMIC_YEAR };
    console.log("[seed] building from SYNTHETIC fixture (not real NCAA rules)");
  } else {
    const fetched = await fetchManual({ pdfPath: args.pdfPath });
    text = fetched.text;
    contentSha256 = fetched.contentSha256;
    retrievedAt = fetched.retrievedAt;
    sourceUrl = fetched.sourceUrl;
    cover = extractCoverMeta(text);
    console.log(`[seed] fetched manual: ${cover.manualTitle} ${cover.academicYear}`);
    console.log(`[seed] content sha256: ${contentSha256}`);
  }

  // 2. Parse + QA gate.
  const sections = parseManualText(text);
  const qa = qaCheck(sections, text.length);
  console.log(`[seed] parsed ${qa.sectionCount} sections`);
  if (!qa.ok) {
    console.error("[seed] QA gate FAILED:");
    for (const p of qa.problems) console.error("  - " + p);
    process.exit(1);
  }

  // 3. Enrich + 4. Embed.
  const chunks = enrich(sections);
  const { vectors, model, dim, mock } = await embedChunks(chunks, { mock: args.mock });
  console.log(`[seed] embedded ${vectors.length} chunks with ${model} (dim ${dim})`);

  // 5. Write artifacts.
  const manifest: Manifest = {
    sourceUrl,
    retrievedAt,
    contentSha256,
    manualTitle: cover.manualTitle,
    academicYear: cover.academicYear,
    effectiveDate: cover.effectiveDate,
    embedModel: model,
    embedDim: dim,
    chunkCount: chunks.length,
    buildCommit: gitCommit(),
    mockEmbeddings: mock,
  };

  await writeFile(path.join(dataDir, "index.meta.json"), JSON.stringify(chunks, null, 2));
  await writeFile(path.join(dataDir, "index.vectors.bin"), packVectors(vectors));
  await writeFile(path.join(dataDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log("[seed] wrote data/index.meta.json, data/index.vectors.bin, data/manifest.json");
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
