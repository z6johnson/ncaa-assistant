# AI feature inventory

Per Responsible AI principle 8 (Accountability). One entry per model-backed
capability.

## NCAA Division I Rules Assistant

- **Owner:** @z6johnson (replace with the accountable maintainer; "the team" is
  not an owner).
- **Purpose:** Help UC San Diego Athletics staff find and understand current NCAA
  Division I rules, with the exact bylaw cite and verbatim rule text. Research
  aid only; not a compliance ruling.
- **Why AI (appropriateness):** Plain-English questions must be matched to the
  right bylaw across a 400+ page manual. Retrieval narrows to real bylaws; the
  model only rephrases and cites from that closed set. A pure keyword search was
  considered but misses paraphrased questions; the model adds plain-language
  synthesis over deterministic retrieval.
- **Models:**
  - Chat: `gpt-oss-120b` (primary), `gpt-5.5` (fallback), via TritonAI hub.
  - Embeddings: `api-tgpt-embeddings` via TritonAI hub.
- **Data classification:** Public NCAA manual text; non-PII rule questions. No
  login, no user identity collected. Queries redacted + truncated before logging.
- **Privacy:** Data minimization at the source; no PII sent to models by design.
  Retention/training disabled on hub clients where supported.
- **Fallback behavior:** On model timeout/error/unparseable output, degrade to
  retrieval-only (top bylaws + verbatim text + disclaimer). Never fabricates.
- **Hallucination guard:** Citations validated against the closed retrieved set;
  verbatim text re-attached from the corpus, not the model. Eval threshold:
  citation precision = 100%.
- **Prompt template:** `grounded-answer.v1` (docs/prompt-templates/), referenced
  by ID in audit logs.
- **Audit trail:** `lib/audit.ts` — requestId, timestamp, redacted query, model,
  prompt id, retrieved chunk ids, returned citations, coverage, latency, fallback,
  error class.
- **Evals:** `evals/grounded-citation.eval.jsonl` + `evals/run-evals.ts`.
- **Appeal path:** docs/rights-and-appeal.md (UC San Diego Athletics compliance
  office).
