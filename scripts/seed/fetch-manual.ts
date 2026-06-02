// Fetch the official Division I Manual PDF and extract its reading-order text.
//
// Version pinning: getReport/90008 is a report generator, not a stable file URL,
// so the SHA-256 of the downloaded bytes is the version of record. The human
// version (academic year, effective date) is read from the cover pages.
//
// Network note: the source host must be reachable from wherever this runs. In a
// restricted network, download the PDF manually and pass --pdf <path> (the same
// hashing/versioning is applied to the local file).

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export interface FetchedManual {
  text: string;
  contentSha256: string;
  retrievedAt: string;
  sourceUrl: string;
  byteLength: number;
}

export interface CoverMeta {
  manualTitle: string;
  academicYear: string;
  effectiveDate?: string;
}

async function extractPdfText(bytes: Uint8Array): Promise<string> {
  // Lazy import: pdfjs is a dev/seed-only dependency, not in the app bundle.
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({ data: bytes, useSystemFonts: true }).promise;
  const pages: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const line = content.items
      .map((it) => ("str" in it ? it.str : ""))
      .join(" ");
    pages.push(line);
  }
  return pages.join("\n");
}

export async function fetchManual(opts: {
  url?: string;
  pdfPath?: string;
}): Promise<FetchedManual> {
  const sourceUrl = opts.url ?? process.env.MANUAL_SOURCE_URL ?? "";
  let bytes: Uint8Array;
  if (opts.pdfPath) {
    bytes = new Uint8Array(await readFile(opts.pdfPath));
  } else {
    if (!sourceUrl) throw new Error("No manual source: set MANUAL_SOURCE_URL or pass --pdf");
    const res = await fetch(sourceUrl, {
      headers: { accept: "application/pdf,*/*" },
    });
    if (!res.ok) throw new Error(`manual fetch failed: HTTP ${res.status}`);
    const ct = res.headers.get("content-type") ?? "";
    const buf = new Uint8Array(await res.arrayBuffer());
    // Fail loudly on non-PDF (e.g. an HTML wrapper or an error page).
    const isPdf = ct.includes("pdf") || (buf[0] === 0x25 && buf[1] === 0x50); // %P
    if (!isPdf) {
      throw new Error(
        `manual source did not return a PDF (content-type: ${ct}). Download manually and pass --pdf.`,
      );
    }
    bytes = buf;
  }

  const contentSha256 = createHash("sha256").update(bytes).digest("hex");
  const text = await extractPdfText(bytes);
  return {
    text,
    contentSha256,
    retrievedAt: new Date().toISOString(),
    sourceUrl: opts.pdfPath ? `file:${opts.pdfPath}` : sourceUrl,
    byteLength: bytes.byteLength,
  };
}

export function extractCoverMeta(text: string): CoverMeta {
  const head = text.slice(0, 4000);
  const yearMatch = head.match(/\b(20\d{2})[-–](\d{2})\b/);
  const academicYear = yearMatch ? `${yearMatch[1]}-${yearMatch[2]}` : "unknown";
  const titleMatch = head.match(/Division\s+I\s+Manual/i);
  const manualTitle = titleMatch ? "NCAA Division I Manual" : "Division I Manual";
  return { manualTitle, academicYear };
}
