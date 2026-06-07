export type GameStatus = "live" | "coming_soon";

export interface GameDefinition {
  id: string;
  slug: string;
  name: string;
  description: string;
  href: string;
  status: GameStatus;
}

export const GAMES: GameDefinition[] = [
  {
    id: "wordless",
    slug: "wordless",
    name: "Wordless",
    description: "Six daily words from 3 to 8 letters.",
    href: "/wordless",
    status: "live",
  },
  {
    id: "clueless",
    slug: "clueless",
    name: "Clueless",
    description: "Solve the daily clue puzzle.",
    href: "/clueless",
    status: "coming_soon",
  },
  {
    id: "songless",
    slug: "songless",
    name: "Songless",
    description: "Name the song from short clips.",
    href: "/songless",
    status: "coming_soon",
  },
];

export function getGameBySlug(slug: string): GameDefinition | undefined {
  return GAMES.find((game) => game.slug === slug);
}

export const LIVE_GAMES = GAMES.filter((game) => game.status === "live");
export const COMING_SOON_GAMES = GAMES.filter(
  (game) => game.status === "coming_soon",
);
