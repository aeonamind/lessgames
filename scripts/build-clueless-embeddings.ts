/**
 * Builds src/games/clueless/data/embeddings.bin from GloVe 6B 50d vectors.
 * Skips when the output file already exists.
 */

import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";

const OUTPUT_PATH = path.join(
  process.cwd(),
  "src/games/clueless/data/embeddings.bin",
);
const GLOVE_URL = "https://nlp.stanford.edu/data/glove.6B.zip";
const GLOVE_MEMBER = "glove.6B.50d.txt";
const MAGIC = 0x434c5642;
const DIMS = 50;
const MIN_LEN = 3;
const MAX_LEN = 12;

type WordVector = {
  word: string;
  vector: Float32Array;
};

function isEligibleWord(word: string): boolean {
  return (
    word.length >= MIN_LEN &&
    word.length <= MAX_LEN &&
    /^[a-z]+$/.test(word)
  );
}

function normalizeVector(vector: Float32Array): Float32Array {
  let sumSq = 0;
  for (const value of vector) {
    sumSq += value * value;
  }
  const norm = Math.sqrt(sumSq);
  if (norm === 0) return vector;

  const normalized = new Float32Array(vector.length);
  for (let i = 0; i < vector.length; i++) {
    normalized[i] = vector[i]! / norm;
  }
  return normalized;
}

function writeBinary(words: WordVector[]): void {
  const fd = createWriteStream(OUTPUT_PATH);
  const header = Buffer.alloc(11);
  header.writeUInt32BE(MAGIC, 0);
  header.writeUInt8(1, 4);
  header.writeUInt16BE(DIMS, 5);
  header.writeUInt32BE(words.length, 7);
  fd.write(header);

  for (const entry of words) {
    const wordBytes = Buffer.from(entry.word, "utf8");
    const wordHeader = Buffer.alloc(1 + wordBytes.length + DIMS * 4);
    wordHeader.writeUInt8(wordBytes.length, 0);
    wordBytes.copy(wordHeader, 1);

    let offset = 1 + wordBytes.length;
    for (let i = 0; i < DIMS; i++) {
      wordHeader.writeFloatLE(entry.vector[i]!, offset);
      offset += 4;
    }

    fd.write(wordHeader);
  }

  fd.end();
}

async function parseVectors(stream: Readable): Promise<WordVector[]> {
  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  const words: WordVector[] = [];

  for await (const line of rl) {
    const space = line.indexOf(" ");
    if (space < 0) continue;

    const word = line.slice(0, space).trim().toLowerCase();
    if (!isEligibleWord(word)) continue;

    const parts = line.slice(space + 1).trim().split(" ");
    if (parts.length !== DIMS) continue;

    const vector = new Float32Array(DIMS);
    for (let i = 0; i < DIMS; i++) {
      vector[i] = Number(parts[i]);
    }

    words.push({ word, vector: normalizeVector(vector) });
  }

  return words;
}

async function main(): Promise<void> {
  try {
    await stat(OUTPUT_PATH);
    console.log(`Embeddings already exist at ${OUTPUT_PATH}, skipping build.`);
    return;
  } catch {
    // build below
  }

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });

  const zipPath = path.join(process.cwd(), ".cache", "glove.6B.zip");
  await mkdir(path.dirname(zipPath), { recursive: true });

  console.log(`Downloading ${GLOVE_URL}...`);
  const response = await fetch(GLOVE_URL);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download GloVe archive (${response.status})`);
  }

  const zipBytes = Buffer.from(await response.arrayBuffer());
  await writeFile(zipPath, zipBytes);
  console.log(`Extracting ${GLOVE_MEMBER}...`);

  const proc = spawn("unzip", ["-p", zipPath, GLOVE_MEMBER], {
    stdio: ["ignore", "pipe", "inherit"],
  });

  if (!proc.stdout) {
    throw new Error("Failed to stream GloVe vectors from zip");
  }

  const words = await parseVectors(Readable.from(proc.stdout));
  const exitCode = await new Promise<number>((resolve, reject) => {
    proc.on("close", resolve);
    proc.on("error", reject);
  });
  if (exitCode !== 0) {
    throw new Error(`unzip failed with exit code ${exitCode}`);
  }

  if (words.length === 0) {
    throw new Error("No eligible words found in GloVe file");
  }

  writeBinary(words);
  await unlink(zipPath).catch(() => undefined);
  console.log(`Wrote ${words.length} words to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
