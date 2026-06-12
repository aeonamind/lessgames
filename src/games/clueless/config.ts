import type { GameDefinition } from "@/games/registry";

export const cluelessConfig = {
  id: "clueless",
  slug: "clueless",
  name: "Clueless",
  description:
    "Find the secret word. Each guess is ranked by semantic similarity.",
  dailySalt: "clueless",
  minAnswerLength: 3,
  maxAnswerLength: 12,
  /** Min f: tag value (occurrences per million, from md=f) for daily answers. */
  minFrequency: 4,
  /** Daily answer is picked only from the N most frequent words in the pool. */
  dailyAnswerTierSize: 120,
  maxDistance: 3000,
  shareTitle: "Clueless",
  nextShuffleLabel: "Next shuffle in",
  footer:
    "Guess words to find today's popular secret word (noun, verb, or adjective). Lower distance = closer in meaning. New shuffle at 3:00 AM GMT+7.",
} as const satisfies Pick<GameDefinition, "id" | "slug" | "name" | "description"> & {
  dailySalt: string;
  minAnswerLength: number;
  maxAnswerLength: number;
  minFrequency: number;
  dailyAnswerTierSize: number;
  maxDistance: number;
  shareTitle: string;
  nextShuffleLabel: string;
  footer: string;
};

export const DISTANCE_COLORS = {
  close: "var(--site-success-emphasis)",
  warm: "var(--tile-present)",
  far: "var(--site-danger)",
} as const;
