import { readFile } from "node:fs/promises";
import path from "node:path";

const MAGIC = 0x434c5642; // "CLVB"
const DATA_PATH = path.join(
  process.cwd(),
  "src/games/clueless/data/embeddings.bin",
);

type EmbeddingStore = {
  dims: number;
  words: string[];
  vectors: Float32Array;
  wordToIndex: Map<string, number>;
};

let storePromise: Promise<EmbeddingStore> | null = null;

function parseBinary(buffer: Buffer): EmbeddingStore {
  if (buffer.length < 11) {
    throw new Error("Embeddings file is too small");
  }

  const magic = buffer.readUInt32BE(0);
  if (magic !== MAGIC) {
    throw new Error("Invalid embeddings file magic");
  }

  const version = buffer.readUInt8(4);
  if (version !== 1) {
    throw new Error(`Unsupported embeddings version: ${version}`);
  }

  const dims = buffer.readUInt16BE(5);
  const count = buffer.readUInt32BE(7);
  const words: string[] = [];
  const wordToIndex = new Map<string, number>();
  const vectors = new Float32Array(count * dims);

  let offset = 11;
  for (let i = 0; i < count; i++) {
    const wordLen = buffer.readUInt8(offset);
    offset += 1;
    const word = buffer.toString("utf8", offset, offset + wordLen);
    offset += wordLen;

    words.push(word);
    wordToIndex.set(word, i);

    for (let d = 0; d < dims; d++) {
      vectors[i * dims + d] = buffer.readFloatLE(offset);
      offset += 4;
    }
  }

  if (offset !== buffer.length) {
    throw new Error("Embeddings file length mismatch");
  }

  return { dims, words, vectors, wordToIndex };
}

export async function loadEmbeddings(): Promise<EmbeddingStore> {
  if (!storePromise) {
    storePromise = readFile(DATA_PATH).then(parseBinary);
  }
  return storePromise;
}

export function hasEmbedding(word: string, store: EmbeddingStore): boolean {
  return store.wordToIndex.has(word.toLowerCase());
}

export function getVector(
  word: string,
  store: EmbeddingStore,
): Float32Array | null {
  const index = store.wordToIndex.get(word.toLowerCase());
  if (index === undefined) return null;

  const { dims, vectors } = store;
  return vectors.subarray(index * dims, index * dims + dims);
}

export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
  }
  return dot;
}

export function clearEmbeddingCache(): void {
  storePromise = null;
}
