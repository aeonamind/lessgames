"use client";

import { fetchDailyWords, validateWord } from "@/games/wordless/lib/api";
import { wordlessConfig } from "@/games/wordless/config";
import {
  addLetter,
  buildSessionFromDailyWords,
  buildShareText,
  getBoardRows,
  removeLetter,
  submitGuess,
  toSavedSession,
} from "@/games/wordless/lib/engine";
import { wordlessStorage } from "@/games/wordless/lib/storage";
import type { WordlessState } from "@/games/wordless/lib/types";
import { DailyCountdown } from "@/shared/components/DailyCountdown";
import { getGameDay } from "@/shared/lib/daily";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Board } from "./Board";
import { Keyboard } from "./Keyboard";
import { LengthPicker } from "./LengthPicker";

export function WordlessGame() {
  const [puzzles, setPuzzles] = useState<Record<number, WordlessState> | null>(
    null,
  );
  const [activeLength, setActiveLength] = useState<number>(
    wordlessConfig.dailyLengths[2],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [shakeRow, setShakeRow] = useState<number | undefined>();
  const [revealRow, setRevealRow] = useState<number | undefined>();
  const [copied, setCopied] = useState(false);
  const [validating, setValidating] = useState(false);

  const loadDaily = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const daily = await fetchDailyWords();
      const saved = wordlessStorage.load();
      const session = buildSessionFromDailyWords(
        daily.words,
        daily.gameDay,
        saved,
      );
      setPuzzles(session.puzzles);
      setActiveLength(session.activeLength);
    } catch {
      setError("Could not load today's words. Check your connection and retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const daily = await fetchDailyWords();
        if (cancelled) return;

        const saved = wordlessStorage.load();
        const session = buildSessionFromDailyWords(
          daily.words,
          daily.gameDay,
          saved,
        );
        setPuzzles(session.puzzles);
        setActiveLength(session.activeLength);
      } catch {
        if (!cancelled) {
          setError(
            "Could not load today's words. Check your connection and retry.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!puzzles) return;
    wordlessStorage.save(toSavedSession(puzzles, activeLength));
  }, [puzzles, activeLength]);

  useEffect(() => {
    const checkDayRollover = () => {
      const today = getGameDay();
      if (puzzles && Object.values(puzzles)[0]?.gameDay === today) return;
      loadDaily();
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
  }, [puzzles, loadDaily]);

  const showMessage = useCallback((text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 1800);
  }, []);

  const updateActivePuzzle = useCallback(
    (updater: (current: WordlessState) => WordlessState) => {
      setPuzzles((current) => {
        if (!current) return current;
        return {
          ...current,
          [activeLength]: updater(current[activeLength]),
        };
      });
    },
    [activeLength],
  );

  const handleKey = useCallback(
    async (key: string) => {
      if (!puzzles) return;
      const state = puzzles[activeLength];
      if (state.status !== "playing" || validating) return;

      if (key === "Enter") {
        if (state.currentGuess.length !== state.length) {
          showMessage("Not enough letters");
          return;
        }

        setValidating(true);
        const isValid = await validateWord(state.currentGuess, state.length);
        setValidating(false);

        if (!isValid) {
          showMessage("Not a valid English word");
          setShakeRow(state.guesses.length);
          window.setTimeout(() => setShakeRow(undefined), 600);
          return;
        }

        const result = submitGuess(state);
        if (!result.ok) return;

        const rowIndex = result.state.guesses.length - 1;
        setRevealRow(rowIndex);
        window.setTimeout(() => setRevealRow(undefined), 1800);

        setPuzzles((current) =>
          current
            ? { ...current, [activeLength]: result.state }
            : current,
        );
        return;
      }

      if (key === "Backspace") {
        updateActivePuzzle(removeLetter);
        return;
      }

      if (/^[A-Z]$/.test(key)) {
        updateActivePuzzle((current) => addLetter(current, key));
      }
    },
    [
      puzzles,
      activeLength,
      validating,
      showMessage,
      updateActivePuzzle,
    ],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "Enter") {
        e.preventDefault();
        void handleKey("Enter");
      } else if (e.key === "Backspace") {
        e.preventDefault();
        void handleKey("Backspace");
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        void handleKey(e.key.toUpperCase());
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleKey]);

  const handleShare = async () => {
    if (!puzzles) return;
    const text = buildShareText(puzzles[activeLength]);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showMessage("Could not copy");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-site-border border-t-site-accent" />
        <p className="text-sm text-site-muted">Loading today&apos;s words…</p>
      </div>
    );
  }

  if (error || !puzzles) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <p className="text-site-text">{error ?? "Something went wrong."}</p>
        <button
          type="button"
          onClick={loadDaily}
          className="rounded-lg bg-site-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-site-accent-hover"
        >
          Retry
        </button>
      </div>
    );
  }

  const state = puzzles[activeLength];
  const rows = getBoardRows(state);
  const finished = state.status !== "playing";
  const completedCount = wordlessConfig.dailyLengths.filter(
    (length) => puzzles[length].status === "won",
  ).length;

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-6 px-4 py-8">
      <header className="flex w-full flex-col items-center gap-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-site-accent">
          Daily puzzles
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-site-text sm:text-5xl">
          Wordless
        </h1>
        <p className="text-sm text-site-muted">
          {completedCount}/{wordlessConfig.dailyLengths.length} solved today
        </p>
        {message && (
          <div className="mt-2 rounded-lg border border-site-border bg-site-surface px-4 py-2 text-sm font-medium text-site-text shadow-sm">
            {message}
          </div>
        )}
      </header>

      <div className="w-full space-y-4">
        <LengthPicker
          lengths={wordlessConfig.dailyLengths}
          activeLength={activeLength}
          puzzles={puzzles}
          onSelect={setActiveLength}
        />

        <div className="rounded-2xl border border-site-border bg-site-surface px-4 py-3 shadow-sm">
          <DailyCountdown nextLabel={wordlessConfig.nextShuffleLabel} />
          <p className="mt-1 text-center text-xs text-site-muted">
            {activeLength}-letter word · {wordlessConfig.maxGuesses} guesses
          </p>
        </div>
      </div>

      <Board
        rows={rows}
        wordLength={activeLength}
        shakeRow={shakeRow}
        revealRow={revealRow}
      />

      {finished && (
        <div className="flex flex-col items-center gap-3 text-center">
          {state.status === "won" ? (
            <p className="text-lg font-semibold text-[var(--tile-correct)]">
              Nice — {state.guesses.length}/{wordlessConfig.maxGuesses}!
            </p>
          ) : (
            <p className="text-lg text-site-text">
              The word was{" "}
              <span className="font-bold tracking-widest text-site-accent">
                {state.answer}
              </span>
            </p>
          )}
          <button
            type="button"
            onClick={handleShare}
            className="rounded-lg border border-site-border bg-site-surface px-6 py-2.5 text-sm font-semibold text-site-text shadow-sm transition hover:border-site-accent/40 hover:bg-site-accent-soft"
          >
            {copied ? "Copied!" : "Share result"}
          </button>
        </div>
      )}

      <div className="w-full">
        <Keyboard
          keyStates={state.keyStates}
          onKey={(key) => void handleKey(key)}
          disabled={finished || validating}
        />
        {validating && (
          <p className="mt-2 text-center text-xs text-site-muted">
            Checking dictionary…
          </p>
        )}
      </div>

      <p className="max-w-md text-center text-xs leading-relaxed text-site-muted">
        {wordlessConfig.footer}
      </p>

      <Link
        href="/"
        className="text-sm font-medium text-site-accent underline-offset-4 hover:underline"
      >
        ← All games
      </Link>
    </div>
  );
}
