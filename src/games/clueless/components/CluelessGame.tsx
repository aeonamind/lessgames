"use client";

import { fetchDaily, requestHint, submitGuess } from "@/games/clueless/lib/api";
import { cluelessConfig } from "@/games/clueless/config";
import {
  applyGuessResult,
  countGuesses,
  createGameState,
  restoreGameState,
  toSavedSession,
  validateGuessInput,
} from "@/games/clueless/lib/engine";
import { cluelessStorage } from "@/games/clueless/lib/storage";
import type { CluelessState, GuessResult } from "@/games/clueless/lib/types";
import { DailyCountdown } from "@/shared/components/DailyCountdown";
import { getGameDay } from "@/shared/lib/daily";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";
import { GuessBar } from "./GuessBar";
import { GuessList } from "./GuessList";
import { ResultModal } from "./ResultModal";

type PendingResult =
  | { type: "loading" }
  | { type: "success"; guess: GuessResult }
  | { type: "error"; message: string };

export function CluelessGame() {
  const [state, setState] = useState<CluelessState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guessInput, setGuessInput] = useState("");
  const [pending, setPending] = useState<PendingResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [hintConfirm, setHintConfirm] = useState(false);
  const [giveUpConfirm, setGiveUpConfirm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadDaily = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const daily = await fetchDaily();
      const saved = cluelessStorage.load();
      setState(restoreGameState(saved ?? createGameState(daily.gameDay), daily.gameDay));
      setPending(null);
      setGuessInput("");
    } catch {
      setError("Could not load today's puzzle. Check your connection and retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDaily();
  }, [loadDaily]);

  useEffect(() => {
    if (!state) return;
    cluelessStorage.save(toSavedSession(state));
  }, [state]);

  useEffect(() => {
    if (!state) return;

    const checkDayRollover = () => {
      const today = getGameDay();
      if (state.gameDay === today) return;
      void loadDaily();
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
  }, [state, loadDaily]);

  useEffect(() => {
    if (state?.status !== "playing") {
      setShowResult(true);
    }
  }, [state?.status]);

  const applyResult = useCallback((result: GuessResult & { gaveUp?: boolean }) => {
    setState((current) => {
      if (!current) return current;
      return applyGuessResult(current, result);
    });
    setPending(null);
  }, []);

  const handleGuessSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!state || state.status !== "playing" || busy) return;

    const validation = validateGuessInput(guessInput, state.guesses);
    if (!validation.ok) {
      setPending({ type: "error", message: validation.message });
      return;
    }

    setBusy(true);
    setPending({ type: "loading" });

    try {
      const result = await submitGuess(validation.word);
      setPending({ type: "success", guess: result });
      applyResult(result);
      setGuessInput("");
    } catch (err) {
      setPending({
        type: "error",
        message:
          err instanceof Error ? err.message : "Failed to process your guess.",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleHint = async (giveUp = false) => {
    if (!state || busy) return;

    setHintConfirm(false);
    setGiveUpConfirm(false);
    setBusy(true);
    setPending({ type: "loading" });

    try {
      const result = await requestHint(
        state.guesses.map((g) => g.word),
        state.guesses.map((g) => g.distance),
        giveUp,
      );
      setPending({ type: "success", guess: result });
      applyResult({ ...result, gaveUp: giveUp });
      setGuessInput("");
    } catch (err) {
      setPending({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to get hint.",
      });
    } finally {
      setBusy(false);
    }
  };

  const markerDistance =
    pending?.type === "success"
      ? pending.guess.distance
      : pending?.type === "error"
        ? state?.guesses.find((g) =>
            pending.message.includes(g.word.charAt(0).toUpperCase() + g.word.slice(1)),
          )?.distance
        : null;

  const answer =
    state?.guesses.find((g) => g.distance === 1)?.word ?? "";

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-site-border border-t-site-accent" />
        <p className="text-sm text-site-muted">Loading today&apos;s puzzle…</p>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <p className="text-site-text">{error ?? "Something went wrong."}</p>
        <button
          type="button"
          onClick={() => void loadDaily()}
          className="gh-btn-primary px-4 py-2 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  const playing = state.status === "playing";
  const guessNumber = playing ? countGuesses(state.guesses) + 1 : countGuesses(state.guesses);

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-5 px-4 py-6">
      <header className="w-full border-b border-site-border pb-4 text-center">
        <h1 className="text-xl font-semibold text-site-text">Clueless</h1>
        <p className="mt-1 text-sm text-site-muted">
          Find the secret word — lower distance means closer in meaning
        </p>
      </header>

      <div className="gh-box w-full px-4 py-3">
        <DailyCountdown nextLabel={cluelessConfig.nextShuffleLabel} />
      </div>

      <form onSubmit={(e) => void handleGuessSubmit(e)} className="w-full">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-site-muted">
              {state.status === "won" ? "✓" : state.status === "lost" ? "🏳️" : "?"}
            </span>
            <input
              ref={inputRef}
              type="text"
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              disabled={!playing || busy}
              autoComplete="off"
              spellCheck={false}
              placeholder={
                state.status === "won"
                  ? `Solved in ${countGuesses(state.guesses)} guesses!`
                  : state.status === "lost"
                    ? `Gave up after ${countGuesses(state.guesses)} guesses`
                    : "Type a word"
              }
              className="gh-box w-full py-3 pr-14 pl-10 text-base font-medium tracking-wide text-site-text outline-none focus:border-site-accent disabled:opacity-60"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-site-muted">
              #{guessNumber}
            </span>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              disabled={busy}
              className="gh-btn-default flex h-12 w-12 items-center justify-center text-lg"
              aria-label="Menu"
            >
              ⋮
            </button>
            {menuOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-md border border-site-border bg-site-canvas shadow-lg">
                  <button
                    type="button"
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-site-canvas-subtle"
                    onClick={() => {
                      setMenuOpen(false);
                      if (state.guesses.some((g) => g.isHint)) {
                        void handleHint(false);
                      } else {
                        setHintConfirm(true);
                      }
                    }}
                    disabled={!playing || busy}
                  >
                    Hint
                  </button>
                  <button
                    type="button"
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-site-canvas-subtle"
                    onClick={() => {
                      setMenuOpen(false);
                      setGiveUpConfirm(true);
                    }}
                    disabled={!playing || busy}
                  >
                    Give up
                  </button>
                  <Link
                    href="/"
                    className="block px-4 py-2 text-sm hover:bg-site-canvas-subtle"
                    onClick={() => setMenuOpen(false)}
                  >
                    All games
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </form>

      {pending && (
        <div className="w-full">
          {pending.type === "loading" && (
            <p className="py-3 text-center text-lg text-site-muted">
              Calculating…
            </p>
          )}
          {pending.type === "error" && (
            <p className="py-3 text-center text-lg text-site-text">
              {pending.message}
            </p>
          )}
          {pending.type === "success" && (
            <div className="py-3 pl-6">
              <GuessBar guess={pending.guess} highlight />
            </div>
          )}
        </div>
      )}

      {!playing && !pending && (
        <button
          type="button"
          onClick={() => setShowResult(true)}
          className="gh-btn-primary px-6 py-2 text-sm"
        >
          Results
        </button>
      )}

      <GuessList guesses={state.guesses} markerDistance={markerDistance} />

      {state.guesses.length === 0 && !pending && (
        <p className="py-8 text-center text-lg text-site-muted">
          Start guessing words to see your progress!
        </p>
      )}

      <p className="max-w-md text-center text-xs text-site-muted">
        {cluelessConfig.footer}
      </p>

      <Link href="/" className="text-sm text-site-accent hover:underline">
        ← All games
      </Link>

      <ResultModal
        state={state}
        answer={answer}
        open={showResult && state.status !== "playing"}
        onClose={() => setShowResult(false)}
      />

      <ConfirmDialog
        open={hintConfirm}
        title="Use a hint?"
        body="Are you sure you want a hint? 🥲"
        onCancel={() => setHintConfirm(false)}
        onConfirm={() => void handleHint(false)}
      />

      <ConfirmDialog
        open={giveUpConfirm}
        title="Give up?"
        body="Are you sure you want to give up? This will reveal the answer and end the game. 😭"
        onCancel={() => setGiveUpConfirm(false)}
        onConfirm={() => void handleHint(true)}
      />
    </div>
  );
}
