// Hybrid retrieval: embedding cosine + lexical overlap + exact bylaw-number
// shortcut + cross-reference expansion. Every candidate carries its real
// chunkId/bylawNumber so citations are drawn from a closed set.

import type { BylawChunk } from "./types";
import type { LoadedIndex } from "./index-loader";
import { cosine } from "./vectors";

export interface Retrieved {
  chunk: BylawChunk;
  score: number;
  citeMatch: boolean;
}

const W_COSINE = 1.0;
const W_LEXICAL = 0.35;
const W_CITE = 0.5;

const BYLAW_NUMBER_RE = /\b\d{1,2}(?:\.\d{1,3}){1,5}\b/g;

function lexicalScore(queryTokens: Set<string>, chunk: BylawChunk): number {
  if (queryTokens.size === 0) return 0;
  const hay = new Set(
    `${chunk.title} ${chunk.keywords.join(" ")}`.toLowerCase().match(/[a-z0-9]+/g) ?? [],
  );
  let hits = 0;
  for (const t of queryTokens) if (hay.has(t)) hits++;
  return hits / queryTokens.size;
}

export function retrieve(
  index: LoadedIndex,
  query: string,
  queryVector: number[],
  k = 8,
): Retrieved[] {
  const { chunks, vectors, manifest } = index;
  const dim = manifest.embedDim;
  const queryTokens = new Set(query.toLowerCase().match(/[a-z0-9]+/g) ?? []);
  const citedNumbers = new Set(query.match(BYLAW_NUMBER_RE) ?? []);

  const scored: Retrieved[] = chunks.map((chunk, i) => {
    const cos = cosine(vectors, i * dim, queryVector, dim);
    const lex = lexicalScore(queryTokens, chunk);
    const citeMatch =
      citedNumbers.has(chunk.bylawNumber) ||
      [...citedNumbers].some(
        (n) => chunk.bylawNumber.startsWith(`${n}.`) || n.startsWith(`${chunk.bylawNumber}.`),
      );
    const score = W_COSINE * cos + W_LEXICAL * lex + (citeMatch ? W_CITE : 0);
    return { chunk, score, citeMatch };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, k);

  // Cross-reference expansion: pull in directly referenced bylaws so the model
  // sees definitions it must rely on, without displacing the primary hits.
  const present = new Set(top.map((r) => r.chunk.bylawNumber));
  const byNumber = new Map(chunks.map((c) => [c.bylawNumber, c]));
  for (const r of [...top]) {
    for (const ref of r.chunk.crossRefs) {
      if (!present.has(ref) && byNumber.has(ref)) {
        present.add(ref);
        top.push({ chunk: byNumber.get(ref)!, score: r.score * 0.5, citeMatch: false });
      }
    }
  }
  return top;
}
