import { cluelessConfig } from "@/games/clueless/config";
import { getDailyIndex, getGameDay } from "@/shared/lib/daily";
import { isSingularWord } from "@/shared/lib/singular-word";
import { validateEnglishWord } from "@/shared/lib/dictionary";
import { hasEmbedding, loadEmbeddings } from "./embeddings";
import { getPopularWordPool } from "./word-provider";

const answerCache = new Map<string, string>();

export async function getDailyAnswer(gameDay = getGameDay()): Promise<string> {
  const cached = answerCache.get(gameDay);
  if (cached) return cached;

  const { dailySalt, dailyAnswerTierSize } = cluelessConfig;
  const [pool, embeddings] = await Promise.all([
    getPopularWordPool(gameDay),
    loadEmbeddings(),
  ]);
  const tier = pool.slice(0, Math.min(dailyAnswerTierSize, pool.length));
  const start = getDailyIndex(gameDay, tier.length, dailySalt);

  for (let offset = 0; offset < tier.length; offset++) {
    const word = tier[(start + offset) % tier.length];
    if (
      hasEmbedding(word, embeddings) &&
      (await validateEnglishWord(word)) &&
      (await isSingularWord(word, validateEnglishWord))
    ) {
      answerCache.set(gameDay, word);
      return word;
    }
  }

  throw new Error("No dictionary-valid word found for today's puzzle");
}

export function clearPuzzleCache(): void {
  answerCache.clear();
}
