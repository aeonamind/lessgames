import { getDailyIndex, getGameDay } from "@/shared/lib/daily";
import {
  type DatamuseEntry,
  hasAllowedPartOfSpeech,
  parseFrequency,
} from "@/shared/lib/datamuse";
import { validateEnglishWord } from "@/shared/lib/dictionary";
import {
  excludePoolPlurals,
  isSingularWord,
} from "@/shared/lib/singular-word";
import { wordlessConfig } from "@/games/wordless/config";

const { dailySalt, minLength, maxLength, minWordFrequency } = wordlessConfig;

type PoolCache = {
  gameDay: string;
  words: string[];
};

const poolCache = new Map<number, PoolCache>();

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

async function buildWordPool(length: number): Promise<string[]> {
  const words = excludePoolPlurals([...new Set(await fetchFromDatamuse(length))]);
  if (words.length === 0) {
    throw new Error(`No words found for length ${length}`);
  }
  return words;
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
    if (!(await isSingularWord(word, validateEnglishWord))) continue;
    if (await validateEnglishWord(word)) {
      return word;
    }
  }

  throw new Error(`No dictionary-valid words found for length ${length}`);
}

export async function getDailyWords(gameDay = getGameDay()) {
  const lengths = wordlessConfig.dailyLengths;
  const words: Record<number, string> = {};

  for (const length of lengths) {
    words[length] = await getDailyWord(length, gameDay);
  }

  return { gameDay, words };
}

export { validateEnglishWord } from "@/shared/lib/dictionary";

export function clearWordCaches(): void {
  poolCache.clear();
}
