import type { GameDefinition } from "@/games/registry";

export const wordlessConfig = {
  id: "wordless",
  slug: "wordless",
  name: "Wordless",
  wordLength: 5,
  maxGuesses: 6,
  dailySalt: "wordless",
  shareTitle: "Wordless",
  nextShuffleLabel: "Next word in",
  footer:
    "Guess the 5-letter word in 6 tries. A new word shuffles daily at 3:00 AM GMT+7.",
} as const satisfies Pick<
  GameDefinition,
  "id" | "slug" | "name"
> & {
  wordLength: number;
  maxGuesses: number;
  dailySalt: string;
  shareTitle: string;
  nextShuffleLabel: string;
  footer: string;
};

export const TILE_COLORS = {
  correct: "#6aaa64",
  present: "#c9b458",
  absent: "#787c7e",
  empty: "#ffffff",
  filled: "#ffffff",
  border: "#d3d6da",
  borderFilled: "#878a8c",
} as const;
