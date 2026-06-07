import { getDailyItem, getGameDay } from "@/shared/lib/daily";
import { wordlessConfig } from "@/games/wordless/config";
import { ANSWERS, isValidGuess } from "@/games/wordless/lib/words";
import type {
  GameStatus,
  GuessRow,
  KeyState,
  SavedWordlessGame,
  Tile,
  TileState,
  WordlessState,
} from "@/games/wordless/lib/types";

const { wordLength, maxGuesses, dailySalt, shareTitle } = wordlessConfig;

export function evaluateGuess(guess: string, answer: string): TileState[] {
  const normalizedGuess = guess.toUpperCase();
  const normalizedAnswer = answer.toUpperCase();
  const result: TileState[] = Array(wordLength).fill("absent");
  const answerCounts: Record<string, number> = {};

  for (const letter of normalizedAnswer) {
    answerCounts[letter] = (answerCounts[letter] ?? 0) + 1;
  }

  for (let i = 0; i < wordLength; i++) {
    if (normalizedGuess[i] === normalizedAnswer[i]) {
      result[i] = "correct";
      answerCounts[normalizedGuess[i]]--;
    }
  }

  for (let i = 0; i < wordLength; i++) {
    if (result[i] === "correct") continue;
    const letter = normalizedGuess[i];
    if ((answerCounts[letter] ?? 0) > 0) {
      result[i] = "present";
      answerCounts[letter]--;
    }
  }

  return result;
}

function tilesFromGuess(guess: string, answer: string): Tile[] {
  const states = evaluateGuess(guess, answer);
  return guess.split("").map((letter, i) => ({
    letter,
    state: states[i],
  }));
}

function emptyRow(): Tile[] {
  return Array.from({ length: wordLength }, () => ({
    letter: "",
    state: "empty" as TileState,
  }));
}

function updateKeyStates(
  current: Record<string, KeyState>,
  guess: string,
  answer: string,
): Record<string, KeyState> {
  const next = { ...current };
  const states = evaluateGuess(guess, answer);
  const priority: Record<KeyState, number> = {
    unused: 0,
    absent: 1,
    present: 2,
    correct: 3,
  };

  guess.split("").forEach((letter, i) => {
    const tileState = states[i];
    const keyState: KeyState =
      tileState === "correct"
        ? "correct"
        : tileState === "present"
          ? "present"
          : "absent";
    const existing = next[letter] ?? "unused";
    if (priority[keyState] > priority[existing]) {
      next[letter] = keyState;
    }
  });

  return next;
}

function getDailyAnswer(now = new Date()): string {
  return getDailyItem(ANSWERS, dailySalt, now);
}

export function createInitialGame(now = new Date()): WordlessState {
  const gameDay = getGameDay(now);
  const answer = getDailyAnswer(now);

  return {
    gameDay,
    answer,
    guesses: [],
    currentGuess: "",
    status: "playing",
    keyStates: {},
  };
}

export function restoreGame(
  saved: SavedWordlessGame,
  now = new Date(),
): WordlessState {
  const gameDay = getGameDay(now);

  if (saved.gameDay !== gameDay) {
    return createInitialGame(now);
  }

  const answer = getDailyAnswer(now);
  let keyStates: Record<string, KeyState> = {};
  const guesses: GuessRow[] = saved.guesses.map((word) => {
    keyStates = updateKeyStates(keyStates, word, answer);
    return { word, tiles: tilesFromGuess(word, answer) };
  });

  return {
    gameDay,
    answer,
    guesses,
    currentGuess: "",
    status: saved.status,
    keyStates,
  };
}

export function toSavedGame(state: WordlessState): SavedWordlessGame {
  return {
    gameDay: state.gameDay,
    guesses: state.guesses.map((g) => g.word),
    status: state.status,
  };
}

export function getBoardRows(state: WordlessState): Tile[][] {
  const rows: Tile[][] = state.guesses.map((g) => g.tiles);

  if (state.status === "playing") {
    const currentRow = emptyRow();
    state.currentGuess.split("").forEach((letter, i) => {
      currentRow[i] = { letter, state: "filled" };
    });
    rows.push(currentRow);

    while (rows.length < maxGuesses) {
      rows.push(emptyRow());
    }
  } else {
    while (rows.length < maxGuesses) {
      rows.push(emptyRow());
    }
  }

  return rows;
}

export type SubmitResult =
  | { ok: true; state: WordlessState }
  | { ok: false; error: "incomplete" | "invalid" | "finished" };

export function submitGuess(state: WordlessState): SubmitResult {
  if (state.status !== "playing") {
    return { ok: false, error: "finished" };
  }

  if (state.currentGuess.length !== wordLength) {
    return { ok: false, error: "incomplete" };
  }

  if (!isValidGuess(state.currentGuess)) {
    return { ok: false, error: "invalid" };
  }

  const word = state.currentGuess.toUpperCase();
  const tiles = tilesFromGuess(word, state.answer);
  const guesses = [...state.guesses, { word, tiles }];
  const keyStates = updateKeyStates(state.keyStates, word, state.answer);

  let status: GameStatus = "playing";
  if (word === state.answer) {
    status = "won";
  } else if (guesses.length >= maxGuesses) {
    status = "lost";
  }

  return {
    ok: true,
    state: {
      ...state,
      guesses,
      currentGuess: "",
      status,
      keyStates,
    },
  };
}

export function addLetter(state: WordlessState, letter: string): WordlessState {
  if (state.status !== "playing") return state;
  if (state.currentGuess.length >= wordLength) return state;

  return {
    ...state,
    currentGuess: state.currentGuess + letter.toUpperCase(),
  };
}

export function removeLetter(state: WordlessState): WordlessState {
  if (state.status !== "playing") return state;

  return {
    ...state,
    currentGuess: state.currentGuess.slice(0, -1),
  };
}

export function buildShareText(state: WordlessState): string {
  const emojiMap: Record<TileState, string> = {
    correct: "🟩",
    present: "🟨",
    absent: "⬛",
    empty: "⬜",
    filled: "⬜",
  };

  const grid = state.guesses
    .map((g) => g.tiles.map((t) => emojiMap[t.state]).join(""))
    .join("\n");

  const score =
    state.status === "won"
      ? `${state.guesses.length}/${maxGuesses}`
      : `X/${maxGuesses}`;

  return `${shareTitle} ${state.gameDay} ${score}\n\n${grid}`;
}
