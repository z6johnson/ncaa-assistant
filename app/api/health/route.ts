// Health + provenance endpoint. Powers the ambient footer (manual version,
// AI-in-use indicator) and lets monitoring confirm the index is loaded.

import { NextResponse } from "next/server";
import { tryLoadIndex } from "@/lib/index-loader";

export const runtime = "nodejs";

export async function GET() {
  const index = await tryLoadIndex();
  const model = process.env.CHAT_MODEL_PRIMARY ?? "gpt-oss-120b";
  if (!index) {
    return NextResponse.json(
      { seeded: false, model, manualVersion: null },
      { status: 200 },
    );
  }
  const { manifest } = index;
  return NextResponse.json({
    seeded: true,
    model,
    manualVersion: `${manifest.academicYear} Division I Manual`,
    effectiveDate: manifest.effectiveDate ?? null,
    contentSha256: manifest.contentSha256.slice(0, 12),
    retrievedAt: manifest.retrievedAt,
    chunkCount: manifest.chunkCount,
    mockEmbeddings: !!manifest.mockEmbeddings,
  });
}
