// Enrich parsed sections with retrieval metadata: cross-references and salient
// keywords. Deterministic (no model calls) so the pipeline stays reproducible
// and cheap.

import type { ParsedSection } from "./parse-bylaws";
import { chunkId } from "./parse-bylaws";
import type { BylawChunk } from "../../lib/types";

const REF_RE = /\b\d{1,2}(?:\.\d{1,3}){1,5}\b/g;

const STOPWORDS = new Set(
  "the a an and or of to in for on at by with shall not may be is are as that this any all from".split(
    " ",
  ),
);

function keywordsOf(title: string, body: string): string[] {
  const counts = new Map<string, number>();
  const tokens = `${title} ${body}`.toLowerCase().match(/[a-z][a-z-]{3,}/g) ?? [];
  for (const t of tokens) {
    if (STOPWORDS.has(t)) continue;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([w]) => w);
}

export function enrich(sections: ParsedSection[]): BylawChunk[] {
  const validNumbers = new Set(sections.map((s) => s.bylawNumber));
  return sections.map((s) => {
    const refs = new Set<string>();
    for (const m of s.verbatimText.match(REF_RE) ?? []) {
      if (m !== s.bylawNumber && validNumbers.has(m)) refs.add(m);
    }
    return {
      chunkId: chunkId(s.bylawNumber, s.verbatimText),
      bylawNumber: s.bylawNumber,
      parentPath: s.parentPath,
      title: s.title,
      verbatimText: s.verbatimText,
      crossRefs: [...refs],
      keywords: keywordsOf(s.title, s.verbatimText),
    };
  });
}
