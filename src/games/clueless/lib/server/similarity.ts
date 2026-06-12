import { validateEnglishWord } from "@/shared/lib/dictionary";
import { getGameDay } from "@/shared/lib/daily";
import {
  cosineSimilarity,
  getVector,
  hasEmbedding,
  loadEmbeddings,
} from "./embeddings";
import { getDailyAnswer } from "./puzzle-provider";

type RankingCache = {
  gameDay: string;
  target: string;
  rankings: Map<string, number>;
  ordered: string[];
  vocabSize: number;
};

const rankingCache = new Map<string, RankingCache>();

function isValidGuessWord(word: string): boolean {
  return /^[a-z]+$/.test(word);
}

async function buildRankings(
  target: string,
  gameDay: string,
): Promise<RankingCache> {
  const normalizedTarget = target.toLowerCase();
  const store = await loadEmbeddings();
  const targetVector = getVector(normalizedTarget, store);

  if (!targetVector) {
    throw new Error(`Daily answer is missing from embedding vocabulary: ${target}`);
  }

  const scored = store.words.map((word) => ({
    word,
    similarity:
      word === normalizedTarget
        ? Number.POSITIVE_INFINITY
        : cosineSimilarity(targetVector, getVector(word, store)!),
  }));

  scored.sort(
    (a, b) =>
      b.similarity - a.similarity || a.word.localeCompare(b.word),
  );

  const rankings = new Map<string, number>();
  const ordered: string[] = [];

  for (let i = 0; i < scored.length; i++) {
    const word = scored[i]!.word;
    rankings.set(word, i + 1);
    ordered.push(word);
  }

  const cache: RankingCache = {
    gameDay,
    target: normalizedTarget,
    rankings,
    ordered,
    vocabSize: scored.length,
  };
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

function resolveDistance(guess: string, cache: RankingCache): number {
  const normalizedGuess = guess.toLowerCase();
  const ranked = cache.rankings.get(normalizedGuess);
  if (ranked === undefined) {
    throw new Error("WORD_NOT_IN_VOCAB");
  }
  return ranked;
}

export async function getSemanticDistance(
  guess: string,
  gameDay = getGameDay(),
): Promise<number> {
  const cache = await getRankings(gameDay);
  return resolveDistance(guess, cache);
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
  const cache = await getRankings(gameDay);
  const distance = resolveDistance(normalizedGuess, cache);

  return {
    word: normalizedGuess,
    distance,
    isHint: false,
    correct: normalizedGuess === cache.target,
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
  const cache = await getRankings(gameDay);
  const { target, ordered, rankings, vocabSize } = cache;

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
      : vocabSize + 1;

  const candidates = ordered
    .filter(
      (word) =>
        !guessed.has(word) &&
        (rankings.get(word) ?? vocabSize + 1) < bestDistance,
    )
    .map((word) => ({ word, distance: rankings.get(word) ?? vocabSize + 1 }))
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

  throw new Error("No hint available");
}

export async function assertKnownWord(word: string): Promise<void> {
  const normalized = word.trim().toLowerCase();
  if (!isValidGuessWord(normalized)) {
    throw new Error("WORD_INVALID");
  }

  const store = await loadEmbeddings();
  if (!hasEmbedding(normalized, store)) {
    throw new Error("WORD_NOT_FOUND");
  }

  const valid = await validateEnglishWord(normalized);
  if (!valid) {
    throw new Error("WORD_NOT_FOUND");
  }
}

export function clearSimilarityCache(): void {
  rankingCache.clear();
}
