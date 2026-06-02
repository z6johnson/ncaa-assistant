// Shared contract between the seed pipeline, the API route, and the UI.

/** One bylaw section parsed from the Division I Manual. Verbatim text is the
 *  authoritative quotation shown to users; it is never paraphrased. */
export interface BylawChunk {
  /** Stable id: bylaw number + short content hash. */
  chunkId: string;
  /** Exact dotted-decimal cite, e.g. "11.1.1.1". */
  bylawNumber: string;
  /** Ancestor numbers, e.g. ["11", "11.1", "11.1.1"]. */
  parentPath: string[];
  /** Section heading as printed in the manual. */
  title: string;
  /** Verbatim rule text. Quoted source: exempt from the no-em-dash output rule. */
  verbatimText: string;
  /** Other bylaw numbers referenced within this section. */
  crossRefs: string[];
  /** Deterministic salient terms (TF-IDF/RAKE), used for lexical boost. */
  keywords: string[];
  pageStart?: number;
  pageEnd?: number;
}

/** Provenance for the seeded corpus. Shown in the ambient footer. */
export interface Manifest {
  sourceUrl: string;
  retrievedAt: string;
  /** Immutable content fingerprint of the source PDF — the version of record. */
  contentSha256: string;
  manualTitle: string;
  academicYear: string;
  effectiveDate?: string;
  embedModel: string;
  embedDim: number;
  chunkCount: number;
  buildCommit?: string;
  /** True when the index was built with the offline mock embedder (dev/CI only). */
  mockEmbeddings?: boolean;
}

export type Coverage = "covered" | "partial" | "uncovered";

export interface Citation {
  bylawNumber: string;
  title: string;
  verbatimText: string;
  parentPath: string[];
}

export interface AskResponse {
  answer: string;
  citations: Citation[];
  coverage: Coverage;
  manualVersion: string;
  modelUsed: string;
  /** True when generation failed and we degraded to retrieval-only. */
  fallbackUsed: boolean;
  disclaimer: string;
}

export const DISCLAIMER =
  "Research aid, not a compliance ruling. Confirm with the UC San Diego Athletics compliance office before acting.";
