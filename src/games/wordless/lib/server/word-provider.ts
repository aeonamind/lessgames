import { getDailyIndex, getGameDay } from "@/shared/lib/daily";
import {
  type DatamuseEntry,
  hasAllowedPartOfSpeech,
  parseFrequency,
} from "@/shared/lib/datamuse";
import { isSingularWord } from "@/shared/lib/singular-word";
import { wordlessConfig } from "@/games/wordless/config";

const { dailySalt, minLength, maxLength, minWordFrequency } = wordlessConfig;

type PoolCache = {
  gameDay: string;
  words: string[];
};

const poolCache = new Map<number, PoolCache>();
const validationCache = new Map<string, boolean>();

function isAlphaWord(word: string, length: number): boolean {
  return word.length === length && /^[a-zA-Z]+$/.test(word);
}

function minFrequencyForLength(length: number): number {
  if (length <= 3) return Math.min(minWordFrequency, 3);
  if (length >= 7) return Math.min(minWordFrequency, 3.25);
  return minWordFrequency;
}

async function fetchFromDatamuse(length: number): Promise<string[]> {
  const pattern = "?".repeat(length);
  const freqMin = minFrequencyForLength(length);
  const response = await fetch(
    `https://api.datamuse.com/words?sp=${pattern}&max=1000&md=fp`,
    { next: { revalidate: 86_400 } },
  );

  if (!response.ok) {
    throw new Error(`Datamuse request failed (${response.status})`);
  }

  const data = (await response.json()) as DatamuseEntry[];
  return data
    .map((entry) => {
      const word = entry.word.trim();
      const frequency = parseFrequency(entry.tags);
      if (
        !isAlphaWord(word, length) ||
        frequency === null ||
        frequency < freqMin ||
        !hasAllowedPartOfSpeech(entry.tags)
      ) {
        return null;
      }
      return { word: word.toUpperCase(), frequency };
    })
    .filter((entry): entry is { word: string; frequency: number } => entry !== null)
    .sort((a, b) => b.frequency - a.frequency || a.word.localeCompare(b.word))
    .map((entry) => entry.word);
}

async function filterSingularWords(words: string[]): Promise<string[]> {
  const kept: string[] = [];

  for (const word of words) {
    if (await isSingularWord(word, validateEnglishWord)) {
      kept.push(word);
    }
  }

  return kept;
}

async function buildWordPool(length: number): Promise<string[]> {
  const words = await fetchFromDatamuse(length);
  const unique = [...new Set(words)];
  const singular = await filterSingularWords(unique);
  return singular.length > 0 ? singular : unique;
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
    if (
      (await validateEnglishWord(word)) &&
      (await isSingularWord(word, validateEnglishWord))
    ) {
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
