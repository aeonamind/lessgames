import { getDailyIndex, getGameDay } from "@/shared/lib/daily";
import { wordlessConfig } from "@/games/wordless/config";

const { dailySalt, minLength, maxLength } = wordlessConfig;

/** Datamuse corpus frequency; filters obscure words like "nek" (0.1). */
const MIN_WORD_FREQUENCY = 1;

type PoolCache = {
  gameDay: string;
  words: string[];
};

const poolCache = new Map<number, PoolCache>();
const validationCache = new Map<string, boolean>();

function isAlphaWord(word: string, length: number): boolean {
  return word.length === length && /^[a-zA-Z]+$/.test(word);
}

type DatamuseEntry = {
  word: string;
  tags?: string[];
};

function parseFrequency(tags: string[] | undefined): number | null {
  const tag = tags?.find((entry) => entry.startsWith("f:"));
  if (!tag) return null;
  const value = Number(tag.slice(2));
  return Number.isFinite(value) ? value : null;
}

async function fetchFromDatamuse(length: number): Promise<string[]> {
  const pattern = "?".repeat(length);
  const response = await fetch(
    `https://api.datamuse.com/words?sp=${pattern}&max=1000&md=f`,
    { next: { revalidate: 86_400 } },
  );

  if (!response.ok) {
    throw new Error(`Datamuse request failed (${response.status})`);
  }

  const data = (await response.json()) as DatamuseEntry[];
  return data
    .filter((entry) => {
      const word = entry.word.trim();
      const frequency = parseFrequency(entry.tags);
      return (
        isAlphaWord(word, length) &&
        frequency !== null &&
        frequency >= MIN_WORD_FREQUENCY
      );
    })
    .map((entry) => entry.word.trim().toUpperCase());
}

async function buildWordPool(length: number): Promise<string[]> {
  const words = await fetchFromDatamuse(length);
  return [...new Set(words)].sort();
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
  const start = getDailyIndex(gameDay, pool.length, `${dailySalt}:${length}`);

  for (let offset = 0; offset < pool.length; offset++) {
    const word = pool[(start + offset) % pool.length];
    if (await validateEnglishWord(word)) {
      return word;
    }
  }

  throw new Error(`No dictionary-valid words found for length ${length}`);
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
