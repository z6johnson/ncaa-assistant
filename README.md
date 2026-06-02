# NCAA Rules Assistant

Ask NCAA Division I rules questions in plain English and get the answer with the
exact bylaw cite and the rule text to verify. A fast research aid for Triton
Athletics coaches and staff. **Not a compliance ruling: confirm with the
Athletics compliance office before acting.**

A lightweight Next.js app (Vercel) that grounds every answer in the official
Division I Manual using build-time retrieval (RAG): the manual is parsed into
per-bylaw chunks, embedded, and committed as an in-memory index. At query time it
retrieves the relevant bylaws and the model answers only from that closed set, so
it never invents rules or cites. Models run on the TritonAI hub
(`gpt-oss-120b` primary, `api-tgpt-embeddings`).

## Setup

```bash
npm install
cp .env.example .env.local   # fill in TRITONAI_BASE_URL and TRITONAI_API_KEY
```

## Seeding the manual (required before real use)

The app answers only when the Division I Manual index exists in `data/`.

```bash
# Real index (needs hub creds and network access to the LSDBi source host):
npm run seed
# or from a manually downloaded PDF (use when the source host is firewalled):
npm run seed -- --pdf path/to/division-i-manual.pdf

# Offline demo/CI index from a SYNTHETIC fixture (no creds, no network):
npm run seed:mock
```

> Network note: the LSDBi source host must be reachable from where `npm run seed`
> runs. Some managed/CI networks block it (`Host not in allowlist`); in that case
> download the PDF and use `--pdf`. The synthetic fixture is clearly labeled in
> the UI footer ("Fixture data, not real rules") and is never authoritative.

## Develop

```bash
npm run dev        # http://localhost:3000
npm run typecheck
npm test           # parser/QA unit tests
npm run evals      # retrieval recall gate (uses whatever index is in data/)
npm run build
```

## How it stays current

`npm run seed:check-freshness` compares the live manual's content hash to the
committed `data/manifest.json`. The weekly `manual-freshness` GitHub Action runs
it and fails loudly on a new manual so a maintainer re-seeds and reviews the
`data/index.meta.json` diff in a PR. Legal text is never rewritten automatically.

## Governance

This repo follows two binding documents: `seed-style-guide.md` (International
Typographic Style + WCAG 2.1 AA) and `responsible-ai-seed-principles.md` (UC
Responsible AI). See `docs/` for the design notes, accessibility statement, AI
feature inventory, and the rights/appeal path.
