export type TileState = "empty" | "filled" | "correct" | "present" | "absent";

export type GameStatus = "playing" | "won" | "lost";

export type KeyState = "unused" | "correct" | "present" | "absent";

export interface Tile {
  letter: string;
  state: TileState;
}

export interface GuessRow {
  word: string;
  tiles: Tile[];
}

export interface WordlessState {
  gameDay: string;
  answer: string;
  guesses: GuessRow[];
  currentGuess: string;
  status: GameStatus;
  keyStates: Record<string, KeyState>;
}

export interface SavedWordlessGame {
  gameDay: string;
  guesses: string[];
  status: GameStatus;
}
