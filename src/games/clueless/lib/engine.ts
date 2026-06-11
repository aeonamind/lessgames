import { cluelessConfig } from "@/games/clueless/config";
import type {
  CluelessState,
  GuessEntry,
  SavedCluelessSession,
} from "@/games/clueless/lib/types";

const { maxDistance } = cluelessConfig;

const BLOCKED_PREFIXES = [
  "rape",
  "rapes",
  "retard",
  "retards",
  "nigga",
  "niggas",
  "nigger",
  "niggers",
  "faggot",
  "faggots",
  "negro",
  "coon",
  "kike",
  "spastic",
];

const TOO_COMMON = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "can",
  "i",
  "you",
  "he",
  "she",
  "it",
  "we",
  "they",
]);

export function capitalizeWord(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export type GuessValidationResult =
  | { ok: true; word: string }
  | { ok: false; message: string };

export function validateGuessInput(
  raw: string,
  guesses: GuessEntry[],
): GuessValidationResult {
  const word = raw.trim().toLowerCase();

  if (word.length < 1) {
    return { ok: false, message: "Word too short" };
  }
  if (word.length > 64) {
    return { ok: false, message: "Word too long" };
  }
  if (!/^[a-zA-Z]+$/.test(word)) {
    return { ok: false, message: "Please enter a valid word" };
  }
  if (BLOCKED_PREFIXES.some((blocked) => word.startsWith(blocked))) {
    return { ok: false, message: "no." };
  }
  if (guesses.some((g) => g.word === word)) {
    return {
      ok: false,
      message: `"${capitalizeWord(word)}" has already been guessed`,
    };
  }
  if (TOO_COMMON.has(word)) {
    return { ok: false, message: "This word is too common. Try again" };
  }

  return { ok: true, word };
}

export function createGameState(gameDay: string): CluelessState {
  return { gameDay, guesses: [], status: "playing" };
}

export function restoreGameState(
  saved: SavedCluelessSession,
  gameDay: string,
): CluelessState {
  if (saved.gameDay !== gameDay) {
    return createGameState(gameDay);
  }

  return {
    gameDay,
    guesses: saved.guesses,
    status: saved.status,
  };
}

export function toSavedSession(state: CluelessState): SavedCluelessSession {
  return {
    gameDay: state.gameDay,
    guesses: state.guesses,
    status: state.status,
  };
}

export function applyGuessResult(
  state: CluelessState,
  result: {
    word: string;
    distance: number;
    isHint: boolean;
    correct: boolean;
    gaveUp?: boolean;
  },
): CluelessState {
  const entry: GuessEntry = {
    word: result.word,
    distance: result.distance,
    isHint: result.isHint,
  };

  const guesses = [...state.guesses, entry].sort(
    (a, b) => a.distance - b.distance,
  );

  if (!result.correct) {
    return { ...state, guesses };
  }

  const gaveUp = result.gaveUp ?? (result.isHint && result.distance === 1);
  return {
    ...state,
    guesses,
    status: gaveUp ? "lost" : "won",
  };
}

/** Progress bar width (0–100) from semantic distance */
export function distanceToProgress(distance: number): number {
  if (distance > maxDistance) return 1;
  const ratio = Math.max(0, Math.min(1, (maxDistance - distance) / maxDistance));
  return 1 + 99 * Math.pow(ratio, 3.5);
}

export function distanceColor(distance: number): string {
  if (distance <= 300) return "var(--site-success-emphasis)";
  if (distance <= 1500) return "var(--tile-present)";
  return "var(--site-danger)";
}

export function countGuesses(guesses: GuessEntry[]): number {
  return guesses.filter((g) => !g.isHint).length;
}

export function countHints(guesses: GuessEntry[]): number {
  return guesses.filter((g) => g.isHint).length;
}

function emojiDigits(value: number): string {
  const digits = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];
  return value
    .toString()
    .split("")
    .map((d) => digits[Number(d)])
    .join("");
}

export function buildShareText(state: CluelessState): string {
  const guesses = countGuesses(state.guesses);
  const hints = countHints(state.guesses);
  const challengeNumber = state.gameDay.replace(/-/g, "");

  if (state.status === "won") {
    return `${cluelessConfig.shareTitle} ${challengeNumber}\nI solved it in ${emojiDigits(guesses)} ${guesses === 1 ? "guess" : "guesses"} with ${emojiDigits(hints)} ${hints === 1 ? "hint" : "hints"}`;
  }

  return `${cluelessConfig.shareTitle} ${challengeNumber}\nI gave up after ${emojiDigits(guesses)} ${guesses === 1 ? "guess" : "guesses"} 💀`;
}
