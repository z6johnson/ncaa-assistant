// Embed bylaw chunks via the hub embeddings model (or the offline mock embedder
// for dev/CI). Batches requests; the embed input includes the bylaw number and
// title to enrich the semantic signal.

import type { BylawChunk } from "../../lib/types";
import { embedTexts } from "../../lib/embeddings";

const BATCH = 64;

export async function embedChunks(
  chunks: BylawChunk[],
  opts: { mock?: boolean } = {},
): Promise<{ vectors: number[][]; model: string; dim: number; mock: boolean }> {
  const inputs = chunks.map(
    (c) => `Bylaw ${c.bylawNumber}: ${c.title}\n${c.verbatimText}`,
  );
  const vectors: number[][] = [];
  let model = "";
  let dim = 0;
  let mock = !!opts.mock;
  for (let i = 0; i < inputs.length; i += BATCH) {
    const slice = inputs.slice(i, i + BATCH);
    const res = await embedTexts(slice, { mock: opts.mock });
    vectors.push(...res.vectors);
    model = res.model;
    dim = res.dim;
    mock = res.mock;
  }
  return { vectors, model, dim, mock };
}
