export type GameStatus = "playing" | "won" | "lost";

export interface GuessEntry {
  word: string;
  distance: number;
  isHint: boolean;
}

export interface CluelessState {
  gameDay: string;
  guesses: GuessEntry[];
  status: GameStatus;
}

export interface SavedCluelessSession {
  gameDay: string;
  guesses: GuessEntry[];
  status: GameStatus;
}

export interface GuessResult {
  word: string;
  distance: number;
  isHint: boolean;
  correct: boolean;
}

export interface DailyResponse {
  gameDay: string;
}
