// Audit logging for accountability and transparency (Responsible AI principles 2,
// 3, 8). Every AI-driven response is logged so it can be reconstructed by
// requestId. No user identity is collected (open, no-login v1). The query is
// stored only as a redacted, length-capped summary.
//
// Sink: stdout/stderr as structured JSON, captured by the Vercel log drain. Swap
// the sink here if an external store is configured via AUDIT_LOG_* env vars.

import { createHash, randomUUID } from "node:crypto";

export interface AuditRecord {
  requestId: string;
  timestamp: string;
  querySummary: string; // redacted + truncated; never raw PII
  queryHash: string;
  modelUsed: string;
  promptTemplateId: string;
  retrievedChunkIds: string[];
  returnedCitations: string[];
  coverage: string;
  latencyMs: number;
  fallbackUsed: boolean;
  errorClass?: string;
}

const MAX_SUMMARY = 160;
// Conservative redaction: strip anything that looks like an email, phone, or SSN
// before the query is logged, in case a user pastes athlete details.
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const PHONE_RE = /\b\+?\d[\d\s().-]{7,}\d\b/g;
const SSN_RE = /\b\d{3}-\d{2}-\d{4}\b/g;

export function redactQuery(query: string): string {
  return query
    .replace(EMAIL_RE, "[email]")
    .replace(PHONE_RE, "[number]")
    .replace(SSN_RE, "[ssn]")
    .slice(0, MAX_SUMMARY)
    .trim();
}

export function newRequestId(): string {
  return randomUUID();
}

export function logAudit(record: AuditRecord): void {
  // One line of structured JSON, retrievable by requestId.
  console.log(JSON.stringify({ kind: "ncaa-assistant-audit", ...record }));
}

export function hashQuery(query: string): string {
  return createHash("sha256").update(query).digest("hex").slice(0, 16);
}
