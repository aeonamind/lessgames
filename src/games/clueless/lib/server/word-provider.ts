import { cluelessConfig } from "@/games/clueless/config";
import { validateEnglishWord } from "@/games/wordless/lib/server/word-provider";
import {
  type DatamuseEntry,
  hasAllowedPartOfSpeech,
  isAlphaWord,
  parseFrequency,
} from "@/shared/lib/datamuse";
import { getGameDay } from "@/shared/lib/daily";
import { isSingularWord } from "@/shared/lib/singular-word";

const { minAnswerLength, maxAnswerLength, minFrequency } = cluelessConfig;

type PoolCache = {
  gameDay: string;
  words: string[];
};

const poolCache: { entry?: PoolCache } = {};

async function fetchPopularByLength(length: number): Promise<DatamuseEntry[]> {
  const pattern = "?".repeat(length);
  const response = await fetch(
    `https://api.datamuse.com/words?sp=${pattern}&max=1000&md=fp`,
    { next: { revalidate: 86_400 } },
  );

  if (!response.ok) {
    throw new Error(`Datamuse request failed (${response.status})`);
  }

  return response.json() as Promise<DatamuseEntry[]>;
}

async function buildPopularWordPool(): Promise<string[]> {
  const byWord = new Map<string, number>();

  const lengthResults = await Promise.all(
    Array.from(
      { length: maxAnswerLength - minAnswerLength + 1 },
      (_, i) => minAnswerLength + i,
    ).map((length) => fetchPopularByLength(length)),
  );

  for (const entries of lengthResults) {
    for (const entry of entries) {
      const word = entry.word.trim().toLowerCase();
      const frequency = parseFrequency(entry.tags);
      if (
        !isAlphaWord(word, minAnswerLength, maxAnswerLength) ||
        frequency === null ||
        frequency < minFrequency ||
        !hasAllowedPartOfSpeech(entry.tags)
      ) {
        continue;
      }

      const existing = byWord.get(word);
      if (existing === undefined || frequency > existing) {
        byWord.set(word, frequency);
      }
    }
  }

  const ranked = [...byWord.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([word]) => word);

  const singular: string[] = [];
  for (const word of ranked) {
    if (await isSingularWord(word, validateEnglishWord)) {
      singular.push(word);
    }
  }

  return singular.length > 0 ? singular : ranked;
}

export async function getPopularWordPool(
  gameDay = getGameDay(),
): Promise<string[]> {
  const cached = poolCache.entry;
  if (cached?.gameDay === gameDay && cached.words.length > 0) {
    return cached.words;
  }

  const words = await buildPopularWordPool();
  if (words.length === 0) {
    throw new Error("No popular words found for answer pool");
  }

  poolCache.entry = { gameDay, words };
  return words;
}

export function clearCluelessWordCache(): void {
  poolCache.entry = undefined;
}
