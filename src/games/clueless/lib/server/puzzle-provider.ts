import { cluelessConfig } from "@/games/clueless/config";
import { getDailyIndex, getGameDay } from "@/shared/lib/daily";
import { isSingularWord } from "@/shared/lib/singular-word";
import { validateEnglishWord } from "@/games/wordless/lib/server/word-provider";
import { getPopularWordPool } from "./word-provider";

const answerCache = new Map<string, string>();

export async function getDailyAnswer(gameDay = getGameDay()): Promise<string> {
  const cached = answerCache.get(gameDay);
  if (cached) return cached;

  const { dailySalt } = cluelessConfig;
  const pool = await getPopularWordPool(gameDay);
  const start = getDailyIndex(gameDay, pool.length, dailySalt);

  for (let offset = 0; offset < pool.length; offset++) {
    const word = pool[(start + offset) % pool.length];
    if (
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
