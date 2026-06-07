"use client";

import { wordlessConfig } from "@/games/wordless/config";
import {
  addLetter,
  buildShareText,
  createInitialGame,
  getBoardRows,
  removeLetter,
  restoreGame,
  submitGuess,
  toSavedGame,
} from "@/games/wordless/lib/engine";
import { wordlessStorage } from "@/games/wordless/lib/storage";
import type { WordlessState } from "@/games/wordless/lib/types";
import { DailyCountdown } from "@/shared/components/DailyCountdown";
import { getGameDay } from "@/shared/lib/daily";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Board } from "./Board";
import { Keyboard } from "./Keyboard";

function loadInitialGame(): WordlessState {
  const saved = wordlessStorage.load();
  return saved ? restoreGame(saved) : createInitialGame();
}

export function WordlessGame() {
  const [state, setState] = useState<WordlessState>(loadInitialGame);
  const [message, setMessage] = useState<string | null>(null);
  const [shakeRow, setShakeRow] = useState<number | undefined>();
  const [revealRow, setRevealRow] = useState<number | undefined>();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    wordlessStorage.save(toSavedGame(state));
  }, [state]);

  useEffect(() => {
    const checkDayRollover = () => {
      setState((current) => {
        const today = getGameDay();
        if (current.gameDay === today) return current;
        return createInitialGame();
      });
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") checkDayRollover();
    };

    document.addEventListener("visibilitychange", onVisibility);
    const id = setInterval(checkDayRollover, 60_000);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(id);
    };
  }, []);

  const showMessage = useCallback((text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 1500);
  }, []);

  const handleKey = useCallback(
    (key: string) => {
      if (state.status !== "playing") return;

      if (key === "Enter") {
        const result = submitGuess(state);
        if (!result.ok) {
          if (result.error === "incomplete") showMessage("Not enough letters");
          if (result.error === "invalid") {
            showMessage("Not in word list");
            setShakeRow(state.guesses.length);
            window.setTimeout(() => setShakeRow(undefined), 600);
          }
          return;
        }

        const rowIndex = result.state.guesses.length - 1;
        setRevealRow(rowIndex);
        window.setTimeout(() => setRevealRow(undefined), 1800);
        setState(result.state);
        return;
      }

      if (key === "Backspace") {
        setState(removeLetter(state));
        return;
      }

      if (/^[A-Z]$/.test(key)) {
        setState(addLetter(state, key));
      }
    },
    [state, showMessage],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "Enter") {
        e.preventDefault();
        handleKey("Enter");
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleKey("Backspace");
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        handleKey(e.key.toUpperCase());
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleKey]);

  const handleShare = async () => {
    const text = buildShareText(state);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showMessage("Could not copy");
    }
  };

  const rows = getBoardRows(state);
  const finished = state.status !== "playing";

  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-6 px-4 py-6">
      <header className="relative flex w-full items-center justify-center">
        <h1 className="text-[2rem] font-bold tracking-[0.2em]">WORDLESS</h1>
        {message && (
          <div className="absolute top-full mt-2 rounded bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
            {message}
          </div>
        )}
      </header>

      <DailyCountdown nextLabel={wordlessConfig.nextShuffleLabel} />

      <Board rows={rows} shakeRow={shakeRow} revealRow={revealRow} />

      {finished && (
        <div className="flex flex-col items-center gap-3 text-center">
          {state.status === "won" ? (
            <p className="text-lg font-semibold text-green-600">
              You got it in {state.guesses.length}!
            </p>
          ) : (
            <p className="text-lg font-semibold">
              The word was{" "}
              <span className="font-bold tracking-widest">{state.answer}</span>
            </p>
          )}
          <button
            type="button"
            onClick={handleShare}
            className="rounded bg-zinc-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {copied ? "Copied!" : "Share"}
          </button>
        </div>
      )}

      <Keyboard
        keyStates={state.keyStates}
        onKey={handleKey}
        disabled={finished}
      />

      <p className="max-w-sm text-center text-xs text-zinc-400">
        {wordlessConfig.footer}
      </p>

      <Link
        href="/"
        className="text-sm font-medium text-zinc-500 underline-offset-4 hover:underline"
      >
        ← All games
      </Link>
    </div>
  );
}
