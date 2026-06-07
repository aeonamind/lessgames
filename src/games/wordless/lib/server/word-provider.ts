import { getDailyIndex, getGameDay } from "@/shared/lib/daily";
import { wordlessConfig } from "@/games/wordless/config";

const { dailySalt, minLength, maxLength } = wordlessConfig;

type PoolCache = {
  gameDay: string;
  words: string[];
};

const poolCache = new Map<number, PoolCache>();
const validationCache = new Map<string, boolean>();

function isAlphaWord(word: string, length: number): boolean {
  return word.length === length && /^[a-zA-Z]+$/.test(word);
}

async function fetchFromDatamuse(length: number): Promise<string[]> {
  const pattern = "?".repeat(length);
  const response = await fetch(
    `https://api.datamuse.com/words?sp=${pattern}&max=1000`,
    { next: { revalidate: 86_400 } },
  );

  if (!response.ok) {
    throw new Error(`Datamuse request failed (${response.status})`);
  }

  const data = (await response.json()) as { word: string }[];
  return data
    .map((entry) => entry.word.trim())
    .filter((word) => isAlphaWord(word, length))
    .map((word) => word.toUpperCase());
}

async function fetchFromRandomWordApi(length: number): Promise<string[]> {
  const response = await fetch(
    `https://random-word-api.herokuapp.com/word?length=${length}&number=300`,
    { next: { revalidate: 86_400 } },
  );

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as string[];
  return data
    .filter((word) => isAlphaWord(word, length))
    .map((word) => word.toUpperCase());
}

async function buildWordPool(length: number): Promise<string[]> {
  const [datamuseWords, randomWords] = await Promise.all([
    fetchFromDatamuse(length),
    fetchFromRandomWordApi(length),
  ]);

  return [...new Set([...datamuseWords, ...randomWords])];
}

export async function getWordPool(
  length: number,
  gameDay = getGameDay(),
): Promise<string[]> {
  if (length < minLength || length > maxLength) {
    throw new Error(`Invalid word length: ${length}`);
  }

  const cached = poolCache.get(length);
  if (cached?.gameDay === gameDay && cached.words.length > 0) {
    return cached.words;
  }

  const words = await buildWordPool(length);
  if (words.length === 0) {
    throw new Error(`No words found for length ${length}`);
  }

  poolCache.set(length, { gameDay, words });
  return words;
}

export async function getDailyWord(
  length: number,
  gameDay = getGameDay(),
): Promise<string> {
  const pool = await getWordPool(length, gameDay);
  const index = getDailyIndex(gameDay, pool.length, `${dailySalt}:${length}`);
  return pool[index];
}

export async function getDailyWords(gameDay = getGameDay()) {
  const lengths = wordlessConfig.dailyLengths;
  const entries = await Promise.all(
    lengths.map(async (length) => {
      const word = await getDailyWord(length, gameDay);
      return [length, word] as const;
    }),
  );

  return {
    gameDay,
    words: Object.fromEntries(entries) as Record<number, string>,
  };
}

export async function validateEnglishWord(word: string): Promise<boolean> {
  const normalized = word.trim().toLowerCase();
  if (!/^[a-z]+$/.test(normalized)) {
    return false;
  }

  const cached = validationCache.get(normalized);
  if (cached !== undefined) {
    return cached;
  }

  const response = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalized)}`,
    { next: { revalidate: 604_800 } },
  );

  const valid = response.ok;
  validationCache.set(normalized, valid);
  return valid;
}

export function clearWordCaches(): void {
  poolCache.clear();
  validationCache.clear();
}
