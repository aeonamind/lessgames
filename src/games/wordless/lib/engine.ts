import { wordlessConfig } from "@/games/wordless/config";
import type {
  GameStatus,
  GuessRow,
  KeyState,
  SavedPuzzle,
  SavedWordlessSession,
  Tile,
  TileState,
  WordlessState,
} from "@/games/wordless/lib/types";

const { maxGuesses, shareTitle } = wordlessConfig;

export function evaluateGuess(
  guess: string,
  answer: string,
  wordLength: number,
): TileState[] {
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

function tilesFromGuess(
  guess: string,
  answer: string,
  wordLength: number,
): Tile[] {
  const states = evaluateGuess(guess, answer, wordLength);
  return guess.split("").map((letter, i) => ({
    letter,
    state: states[i],
  }));
}

function emptyRow(wordLength: number): Tile[] {
  return Array.from({ length: wordLength }, () => ({
    letter: "",
    state: "empty" as TileState,
  }));
}

function updateKeyStates(
  current: Record<string, KeyState>,
  guess: string,
  answer: string,
  wordLength: number,
): Record<string, KeyState> {
  const next = { ...current };
  const states = evaluateGuess(guess, answer, wordLength);
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
    const key = letter.toUpperCase();
    const existing = next[key] ?? "unused";
    if (priority[keyState] > priority[existing]) {
      next[key] = keyState;
    }
  });

  return next;
}

export function createPuzzleState(
  gameDay: string,
  length: number,
  answer: string,
): WordlessState {
  return {
    gameDay,
    length,
    answer,
    guesses: [],
    currentGuess: "",
    status: "playing",
    keyStates: {},
  };
}

export function restorePuzzleState(
  saved: SavedPuzzle,
  gameDay: string,
  length: number,
  answer: string,
): WordlessState {
  let keyStates: Record<string, KeyState> = {};
  const guesses: GuessRow[] = saved.guesses.map((rawWord) => {
    const word = rawWord.toUpperCase();
    keyStates = updateKeyStates(keyStates, word, answer, length);
    return { word, tiles: tilesFromGuess(word, answer, length) };
  });

  return {
    gameDay,
    length,
    answer,
    guesses,
    currentGuess: "",
    status: saved.status,
    keyStates,
  };
}

export function toSavedPuzzle(state: WordlessState): SavedPuzzle {
  return {
    guesses: state.guesses.map((g) => g.word),
    status: state.status,
  };
}

export function toSavedSession(
  puzzles: Record<number, WordlessState>,
  activeLength: number,
): SavedWordlessSession {
  const gameDay = puzzles[activeLength]?.gameDay ?? "";
  const savedPuzzles: Record<string, SavedPuzzle> = {};

  for (const [length, puzzle] of Object.entries(puzzles)) {
    savedPuzzles[length] = toSavedPuzzle(puzzle);
  }

  return { gameDay, activeLength, puzzles: savedPuzzles };
}

export function getBoardRows(state: WordlessState): Tile[][] {
  const rows: Tile[][] = state.guesses.map((g) => g.tiles);

  if (state.status === "playing") {
    const currentRow = emptyRow(state.length);
    state.currentGuess.split("").forEach((letter, i) => {
      currentRow[i] = { letter, state: "filled" };
    });
    rows.push(currentRow);

    while (rows.length < maxGuesses) {
      rows.push(emptyRow(state.length));
    }
  } else {
    while (rows.length < maxGuesses) {
      rows.push(emptyRow(state.length));
    }
  }

  return rows;
}

export type SubmitResult =
  | { ok: true; state: WordlessState }
  | { ok: false; error: "incomplete" | "finished" };

export function submitGuess(state: WordlessState): SubmitResult {
  if (state.status !== "playing") {
    return { ok: false, error: "finished" };
  }

  if (state.currentGuess.length !== state.length) {
    return { ok: false, error: "incomplete" };
  }

  const word = state.currentGuess.toUpperCase();
  const tiles = tilesFromGuess(word, state.answer, state.length);
  const guesses = [...state.guesses, { word, tiles }];
  const keyStates = updateKeyStates(
    state.keyStates,
    word,
    state.answer,
    state.length,
  );

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
  if (state.currentGuess.length >= state.length) return state;

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

  return `${shareTitle} ${state.gameDay} ${state.length}-letter ${score}\n\n${grid}`;
}

export function buildSessionFromDailyWords(
  dailyWords: Record<number, string>,
  gameDay: string,
  saved: SavedWordlessSession | null,
): { puzzles: Record<number, WordlessState>; activeLength: number } {
  const activeLength =
    saved?.gameDay === gameDay
      ? saved.activeLength
      : wordlessConfig.dailyLengths[2];

  const puzzles = {} as Record<number, WordlessState>;

  for (const length of wordlessConfig.dailyLengths) {
    const answer = dailyWords[length];
    const savedPuzzle =
      saved?.gameDay === gameDay ? saved.puzzles[String(length)] : undefined;

    puzzles[length] = savedPuzzle
      ? restorePuzzleState(savedPuzzle, gameDay, length, answer)
      : createPuzzleState(gameDay, length, answer);
  }

  return { puzzles, activeLength };
}
