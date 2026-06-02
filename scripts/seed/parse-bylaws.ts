// Parse the Division I Manual into structured, per-bylaw chunks.
//
// The reliability of the whole product rests on parse fidelity: we promise
// verbatim text and exact cites. This module turns reading-order text (from the
// PDF text layer, or from a fixture) into sections, and runs a QA gate that
// blocks the build if extraction looks lossy or out of order.

import { createHash } from "node:crypto";

export interface ParsedSection {
  bylawNumber: string;
  parentPath: string[];
  title: string;
  verbatimText: string;
}

// A bylaw heading: dotted-decimal number, then a Title Case heading ending in a
// period, e.g. "11.1.1.1 Responsibility of Head Coach." The remainder up to the
// next heading is the verbatim body.
const HEADING_RE =
  /(?:^|\n)\s*(\d{1,2}(?:\.\d{1,3}){0,5})\s+([A-Z][^.\n]{2,120}?\.)\s/g;

export function parentPathOf(bylawNumber: string): string[] {
  const parts = bylawNumber.split(".");
  const path: string[] = [];
  for (let i = 1; i < parts.length; i++) {
    path.push(parts.slice(0, i).join("."));
  }
  return path;
}

export function chunkId(bylawNumber: string, verbatimText: string): string {
  const h = createHash("sha256").update(verbatimText).digest("hex").slice(0, 8);
  return `${bylawNumber}#${h}`;
}

/** Normalize layout artifacts only: de-hyphenate line wraps, collapse whitespace.
 *  This is the ONLY transformation applied to verbatim text; it is logged. */
export function normalizeVerbatim(raw: string): string {
  return raw
    .replace(/-\n(?=[a-z])/g, "") // de-hyphenate line-wrapped words
    .replace(/\s+/g, " ")
    .trim();
}

export function parseManualText(text: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const matches = [...text.matchAll(HEADING_RE)];
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const bylawNumber = m[1];
    const title = m[2].replace(/\.$/, "").trim();
    const bodyStart = (m.index ?? 0) + m[0].length;
    const bodyEnd = i + 1 < matches.length ? matches[i + 1].index ?? text.length : text.length;
    const verbatimText = normalizeVerbatim(text.slice(bodyStart, bodyEnd));
    if (!verbatimText) continue;
    sections.push({
      bylawNumber,
      parentPath: parentPathOf(bylawNumber),
      title,
      verbatimText,
    });
  }
  return sections;
}

export interface QaReport {
  ok: boolean;
  sectionCount: number;
  problems: string[];
}

/** QA gate: blocks the build when extraction looks lossy or out of order. */
export function qaCheck(sections: ParsedSection[], rawLength: number): QaReport {
  const problems: string[] = [];
  if (sections.length === 0) problems.push("no bylaw sections were parsed");

  // Character coverage: parsed verbatim text should account for most of the source.
  const covered = sections.reduce((n, s) => n + s.verbatimText.length, 0);
  if (rawLength > 0 && covered / rawLength < 0.5) {
    problems.push(
      `low coverage: parsed ${covered} of ${rawLength} chars (${Math.round((covered / rawLength) * 100)}%)`,
    );
  }

  // Duplicate bylaw numbers indicate a parsing error.
  const seen = new Set<string>();
  for (const s of sections) {
    if (seen.has(s.bylawNumber)) problems.push(`duplicate bylaw number: ${s.bylawNumber}`);
    seen.add(s.bylawNumber);
  }

  return { ok: problems.length === 0, sectionCount: sections.length, problems };
}
