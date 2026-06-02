// Pack/unpack the embedding matrix as little-endian float32. The vectors live in
// data/index.vectors.bin (out of the diffable meta file); order matches the
// chunks array in index.meta.json.

export function packVectors(vectors: number[][]): Buffer {
  const count = vectors.length;
  const dim = count > 0 ? vectors[0].length : 0;
  const buf = Buffer.allocUnsafe(count * dim * 4);
  let offset = 0;
  for (const v of vectors) {
    if (v.length !== dim) throw new Error("ragged embedding matrix: dim mismatch");
    for (let i = 0; i < dim; i++) {
      buf.writeFloatLE(v[i], offset);
      offset += 4;
    }
  }
  return buf;
}

/** View the packed buffer as a single Float32Array (count * dim). */
export function unpackVectors(buf: Buffer | ArrayBuffer | Uint8Array): Float32Array {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  // Copy into an aligned buffer so the Float32Array view is valid.
  const aligned = new ArrayBuffer(u8.byteLength);
  new Uint8Array(aligned).set(u8);
  return new Float32Array(aligned);
}

export function cosine(a: Float32Array, aOffset: number, b: number[], dim: number): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < dim; i++) {
    const av = a[aOffset + i];
    const bv = b[i];
    dot += av * bv;
    na += av * av;
    nb += bv * bv;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}
