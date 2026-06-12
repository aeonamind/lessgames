import { cluelessConfig } from "@/games/clueless/config";
import { validateEnglishWord } from "@/shared/lib/dictionary";
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

function isValidGuessWord(word: string): boolean {
  return /^[a-z]+$/.test(word);
}

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

async function fetchTargetRankInList(
  url: string,
  target: string,
): Promise<number | null> {
  const response = await fetch(url, { next: { revalidate: 86_400 } });
  if (!response.ok) return null;

  const data = (await response.json()) as DatamuseEntry[];
  const index = data.findIndex(
    (entry) => entry.word.trim().toLowerCase() === target,
  );

  if (index < 0) return null;
  return index + 2;
}

async function fetchReverseDistance(
  guess: string,
  target: string,
): Promise<number | null> {
  const encodedGuess = encodeURIComponent(guess);
  const ranks = await Promise.all([
    fetchTargetRankInList(
      `https://api.datamuse.com/words?ml=${encodedGuess}&max=1000`,
      target,
    ),
    fetchTargetRankInList(
      `https://api.datamuse.com/words?rel_syn=${encodedGuess}&max=1000`,
      target,
    ),
    fetchTargetRankInList(
      `https://api.datamuse.com/words?rel_trg=${encodedGuess}&max=500`,
      target,
    ),
  ]);

  const valid = ranks.filter((rank): rank is number => rank !== null);
  if (valid.length === 0) return null;
  return Math.min(...valid);
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

async function resolveDistance(
  guess: string,
  cache: RankingCache,
): Promise<number> {
  const normalizedGuess = guess.toLowerCase();
  const { rankings, target, ordered } = cache;

  if (normalizedGuess === target) return 1;

  const ranked = rankings.get(normalizedGuess);
  if (ranked !== undefined) return ranked;

  const reverse = await fetchReverseDistance(normalizedGuess, target);
  if (reverse !== null) {
    rankings.set(normalizedGuess, reverse);
    ordered.push(normalizedGuess);
    ordered.sort(
      (a, b) => (rankings.get(a) ?? maxDistance) - (rankings.get(b) ?? maxDistance),
    );
    return reverse;
  }

  return maxDistance;
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
  const distance = await resolveDistance(normalizedGuess, cache);

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
  const { target, ordered, rankings } = cache;

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
    .filter(
      (word) =>
        !guessed.has(word) &&
        (rankings.get(word) ?? maxDistance) < bestDistance,
    )
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
