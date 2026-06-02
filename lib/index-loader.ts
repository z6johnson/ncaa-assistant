// Loads the committed bylaw index once per process into a module-level singleton,
// shared across warm serverless invocations. Brute-force cosine over a few
// thousand vectors is single-digit milliseconds, so no vector DB is needed.

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { BylawChunk, Manifest } from "./types";
import { unpackVectors } from "./vectors";

export interface LoadedIndex {
  chunks: BylawChunk[];
  vectors: Float32Array; // length === chunks.length * manifest.embedDim
  manifest: Manifest;
}

const DATA_DIR = path.join(process.cwd(), "data");

let cached: LoadedIndex | null = null;
let loadError: string | null = null;

export async function loadIndex(): Promise<LoadedIndex> {
  if (cached) return cached;
  if (loadError) throw new Error(loadError);
  try {
    const [metaRaw, manifestRaw, vecBuf] = await Promise.all([
      readFile(path.join(DATA_DIR, "index.meta.json"), "utf8"),
      readFile(path.join(DATA_DIR, "manifest.json"), "utf8"),
      readFile(path.join(DATA_DIR, "index.vectors.bin")),
    ]);
    const chunks = JSON.parse(metaRaw) as BylawChunk[];
    const manifest = JSON.parse(manifestRaw) as Manifest;
    const vectors = unpackVectors(vecBuf);
    const expected = chunks.length * manifest.embedDim;
    if (vectors.length !== expected) {
      throw new Error(
        `index corrupt: expected ${expected} floats, found ${vectors.length}`,
      );
    }
    cached = { chunks, vectors, manifest };
    return cached;
  } catch (err) {
    loadError = `Bylaw index not available: ${(err as Error).message}`;
    throw new Error(loadError);
  }
}

/** Returns the index or null if the manual has not been seeded yet. */
export async function tryLoadIndex(): Promise<LoadedIndex | null> {
  try {
    return await loadIndex();
  } catch {
    return null;
  }
}
