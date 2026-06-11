import { cluelessConfig } from "@/games/clueless/config";
import { validateEnglishWord } from "@/games/wordless/lib/server/word-provider";
import { getGameDay } from "@/shared/lib/daily";
import { getDailyAnswer } from "./puzzle-provider";

const { maxDistance } = cluelessConfig;

type RankingCache = {
  gameDay: string;
  target: string;
  rankings: Map<string, number>;
  ordered: string[];
};

const rankingCache = new Map<string, RankingCache>();

type DatamuseEntry = {
  word: string;
  score?: number;
};

async function fetchSimilarWords(target: string): Promise<DatamuseEntry[]> {
  const response = await fetch(
    `https://api.datamuse.com/words?ml=${encodeURIComponent(target)}&max=1000`,
    { next: { revalidate: 86_400 } },
  );

  if (!response.ok) {
    throw new Error(`Datamuse request failed (${response.status})`);
  }

  return response.json() as Promise<DatamuseEntry[]>;
}

function isValidGuessWord(word: string): boolean {
  return /^[a-z]+$/.test(word);
}

async function buildRankings(
  target: string,
  gameDay: string,
): Promise<RankingCache> {
  const normalizedTarget = target.toLowerCase();
  const rankings = new Map<string, number>();
  const ordered: string[] = [];

  rankings.set(normalizedTarget, 1);
  ordered.push(normalizedTarget);

  const similar = await fetchSimilarWords(normalizedTarget);
  let distance = 2;

  for (const entry of similar) {
    const word = entry.word.trim().toLowerCase();
    if (!isValidGuessWord(word) || rankings.has(word)) continue;
    rankings.set(word, distance);
    ordered.push(word);
    distance++;
  }

  const reverse = await fetch(
    `https://api.datamuse.com/words?rel_trg=${encodeURIComponent(normalizedTarget)}&max=500`,
    { next: { revalidate: 86_400 } },
  );

  if (reverse.ok) {
    const triggers = (await reverse.json()) as DatamuseEntry[];
    for (const entry of triggers) {
      const word = entry.word.trim().toLowerCase();
      if (!isValidGuessWord(word) || rankings.has(word)) continue;
      rankings.set(word, distance);
      ordered.push(word);
      distance++;
    }
  }

  const cache: RankingCache = { gameDay, target: normalizedTarget, rankings, ordered };
  rankingCache.set(gameDay, cache);
  return cache;
}

export async function getRankings(
  gameDay = getGameDay(),
): Promise<RankingCache> {
  const cached = rankingCache.get(gameDay);
  if (cached) return cached;

  const target = await getDailyAnswer(gameDay);
  return buildRankings(target, gameDay);
}

export async function getSemanticDistance(
  guess: string,
  gameDay = getGameDay(),
): Promise<number> {
  const normalizedGuess = guess.toLowerCase();
  const { rankings, target } = await getRankings(gameDay);

  if (normalizedGuess === target) return 1;

  const ranked = rankings.get(normalizedGuess);
  if (ranked !== undefined) return ranked;

  return maxDistance;
}

export async function resolveGuess(
  guess: string,
  gameDay = getGameDay(),
): Promise<{
  word: string;
  distance: number;
  isHint: boolean;
  correct: boolean;
}> {
  const normalizedGuess = guess.trim().toLowerCase();
  const { target } = await getRankings(gameDay);
  const distance = await getSemanticDistance(normalizedGuess, gameDay);

  return {
    word: normalizedGuess,
    distance,
    isHint: false,
    correct: normalizedGuess === target,
  };
}

export async function resolveHint(
  guessedWords: string[],
  guessedDistances: number[],
  giveUp: boolean,
  gameDay = getGameDay(),
): Promise<{
  word: string;
  distance: number;
  isHint: boolean;
  correct: boolean;
  gaveUp?: boolean;
}> {
  const { target, ordered, rankings } = await getRankings(gameDay);

  if (giveUp) {
    return {
      word: target,
      distance: 1,
      isHint: true,
      correct: true,
      gaveUp: true,
    };
  }

  const guessed = new Set(guessedWords.map((w) => w.toLowerCase()));
  const bestDistance =
    guessedDistances.length > 0
      ? Math.min(...guessedDistances)
      : maxDistance;

  const candidates = ordered
    .filter((word) => !guessed.has(word) && (rankings.get(word) ?? maxDistance) < bestDistance)
    .map((word) => ({ word, distance: rankings.get(word) ?? maxDistance }))
    .sort((a, b) => b.distance - a.distance);

  if (candidates.length > 0) {
    const pick = candidates[0];
    return {
      word: pick.word,
      distance: pick.distance,
      isHint: true,
      correct: pick.word === target,
    };
  }

  for (const word of ordered) {
    if (guessed.has(word)) continue;
    const distance = rankings.get(word) ?? maxDistance;
    if (distance < bestDistance) {
      return {
        word,
        distance,
        isHint: true,
        correct: word === target,
      };
    }
  }

  throw new Error("No hint available");
}

export async function assertKnownWord(word: string): Promise<void> {
  const normalized = word.trim().toLowerCase();
  if (!isValidGuessWord(normalized)) {
    throw new Error("WORD_INVALID");
  }

  const valid = await validateEnglishWord(normalized);
  if (!valid) {
    throw new Error("WORD_NOT_FOUND");
  }
}

export function clearSimilarityCache(): void {
  rankingCache.clear();
}
