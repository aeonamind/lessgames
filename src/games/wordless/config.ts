import type { GameDefinition } from "@/games/registry";

export const wordlessConfig = {
  id: "wordless",
  slug: "wordless",
  name: "Wordless",
  minLength: 3,
  maxLength: 8,
  dailyLengths: [3, 4, 5, 6, 7, 8],
  maxGuesses: 6,
  dailySalt: "wordless",
  shareTitle: "Wordless",
  nextShuffleLabel: "Next shuffle in",
  footer:
    "Six daily words (3–8 letters). Common English words from Datamuse; guesses checked against a dictionary. New shuffle at 3:00 AM GMT+7.",
} as const satisfies Pick<GameDefinition, "id" | "slug" | "name"> & {
  minLength: number;
  maxLength: number;
  dailyLengths: readonly number[];
  maxGuesses: number;
  dailySalt: string;
  shareTitle: string;
  nextShuffleLabel: string;
  footer: string;
};

export const TILE_THEME = {
  correct: "var(--wordless-correct)",
  present: "var(--wordless-present)",
  absent: "var(--wordless-absent)",
  filled: "var(--wordless-filled)",
  empty: "var(--wordless-empty)",
  border: "var(--wordless-border)",
} as const;
