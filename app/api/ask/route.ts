// Query-time grounded answer endpoint. Node runtime: loads the in-memory index
// and calls the model hub.
//
// Data path: question (no login/PII) -> embed -> retrieve real bylaws -> model
// answers ONLY from those -> citations validated against the closed retrieved
// set -> verbatim text re-attached from the corpus (never from the model).
// On model failure: degrade to retrieval-only. Audit log written per request.

import { NextRequest, NextResponse } from "next/server";
import { tryLoadIndex } from "@/lib/index-loader";
import { embedTexts } from "@/lib/embeddings";
import { retrieve, type Retrieved } from "@/lib/retrieval";
import { buildMessages, PROMPT_TEMPLATE_ID } from "@/lib/prompt";
import { generateAnswer } from "@/lib/chat";
import {
  hashQuery,
  logAudit,
  newRequestId,
  redactQuery,
  type AuditRecord,
} from "@/lib/audit";
import {
  DISCLAIMER,
  type AskResponse,
  type Citation,
  type Coverage,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_QUERY_LEN = 1000;

// Strip em dashes from generated prose (the model is also instructed). Quoted
// verbatim bylaw text is exempt and is never passed through this.
function stripEmDashes(text: string): string {
  return text.replace(/\s*[—–]\s*/g, ", ").replace(/, ,/g, ",");
}

function citationsFrom(retrieved: Retrieved[], numbers: string[]): Citation[] {
  const byNumber = new Map(retrieved.map((r) => [r.chunk.bylawNumber, r.chunk]));
  const seen = new Set<string>();
  const out: Citation[] = [];
  for (const n of numbers) {
    const chunk = byNumber.get(n);
    if (chunk && !seen.has(n)) {
      seen.add(n);
      out.push({
        bylawNumber: chunk.bylawNumber,
        title: chunk.title,
        verbatimText: chunk.verbatimText, // re-attached from the corpus
        parentPath: chunk.parentPath,
      });
    }
  }
  return out;
}

function parseModelJson(content: string): {
  answer: string;
  citations: { bylawNumber: string }[];
  coverage: Coverage;
} | null {
  try {
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    const obj = JSON.parse(content.slice(start, end + 1));
    return {
      answer: String(obj.answer ?? ""),
      citations: Array.isArray(obj.citations) ? obj.citations : [],
      coverage: (["covered", "partial", "uncovered"] as const).includes(obj.coverage)
        ? obj.coverage
        : "partial",
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const requestId = newRequestId();
  const startedAt = Date.now();

  let query = "";
  try {
    const body = (await req.json()) as { query?: unknown };
    query = typeof body.query === "string" ? body.query.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!query) {
    return NextResponse.json({ error: "Enter a question." }, { status: 400 });
  }
  if (query.length > MAX_QUERY_LEN) {
    return NextResponse.json({ error: "Question is too long." }, { status: 400 });
  }

  const index = await tryLoadIndex();
  if (!index) {
    // Un-seeded state: be honest, do not fabricate.
    return NextResponse.json(
      {
        error:
          "The Division I Manual has not been loaded yet. Run the seed pipeline (npm run seed) before using the assistant.",
      },
      { status: 503 },
    );
  }

  const manualVersion = `${index.manifest.academicYear} Division I Manual`;
  const audit: AuditRecord = {
    requestId,
    timestamp: new Date().toISOString(),
    querySummary: redactQuery(query),
    queryHash: hashQuery(query),
    modelUsed: "",
    promptTemplateId: PROMPT_TEMPLATE_ID,
    retrievedChunkIds: [],
    returnedCitations: [],
    coverage: "uncovered",
    latencyMs: 0,
    fallbackUsed: false,
  };

  try {
    const { vectors } = await embedTexts([query], { mock: index.manifest.mockEmbeddings });
    const retrieved = retrieve(index, query, vectors[0]);
    audit.retrievedChunkIds = retrieved.map((r) => r.chunk.chunkId);

    let response: AskResponse;
    try {
      const messages = buildMessages(query, retrieved);
      const result = await generateAnswer(messages);
      audit.modelUsed = result.model;
      const parsed = parseModelJson(result.content);
      if (!parsed) throw new Error("model returned unparseable output");

      // Closed-set validation: drop any cite not in the retrieved context.
      const citations = citationsFrom(
        retrieved,
        parsed.citations.map((c) => c.bylawNumber),
      );
      const coverage: Coverage =
        citations.length === 0 ? "uncovered" : parsed.coverage;
      const answer =
        coverage === "uncovered"
          ? "I could not find a Division I bylaw that clearly answers this. Please confirm with the UC San Diego Athletics compliance office."
          : stripEmDashes(parsed.answer);

      response = {
        answer,
        citations: coverage === "uncovered" ? [] : citations,
        coverage,
        manualVersion,
        modelUsed: result.model,
        fallbackUsed: false,
        disclaimer: DISCLAIMER,
      };
    } catch (modelErr) {
      // Graceful fallback: retrieval-only. Surface the error in the log.
      audit.fallbackUsed = true;
      audit.errorClass = (modelErr as Error).message.slice(0, 120);
      const topCites = citationsFrom(
        retrieved,
        retrieved.slice(0, 4).map((r) => r.chunk.bylawNumber),
      );
      response = {
        answer:
          "The answer model is unavailable right now. Here are the most relevant bylaws to read directly. Confirm with the UC San Diego Athletics compliance office.",
        citations: topCites,
        coverage: topCites.length ? "partial" : "uncovered",
        manualVersion,
        modelUsed: audit.modelUsed || "unavailable",
        fallbackUsed: true,
        disclaimer: DISCLAIMER,
      };
    }

    audit.returnedCitations = response.citations.map((c) => c.bylawNumber);
    audit.coverage = response.coverage;
    audit.latencyMs = Date.now() - startedAt;
    logAudit(audit);
    return NextResponse.json(response);
  } catch (err) {
    audit.errorClass = (err as Error).message.slice(0, 120);
    audit.latencyMs = Date.now() - startedAt;
    logAudit(audit);
    return NextResponse.json(
      { error: "Something went wrong handling your question. Please try again." },
      { status: 500 },
    );
  }
}
