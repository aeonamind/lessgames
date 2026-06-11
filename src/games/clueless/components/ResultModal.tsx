"use client";

import {
  buildShareText,
  countGuesses,
  countHints,
} from "@/games/clueless/lib/engine";
import type { CluelessState } from "@/games/clueless/lib/types";

interface ResultModalProps {
  state: CluelessState;
  answer: string;
  open: boolean;
  onClose: () => void;
}

export function ResultModal({ state, answer, open, onClose }: ResultModalProps) {
  if (!open) return null;

  const won = state.status === "won";
  const guesses = countGuesses(state.guesses);
  const hints = countHints(state.guesses);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(buildShareText(state));
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="gh-box w-full max-w-md overflow-hidden">
        <div
          className={`px-4 py-3 text-center text-xl font-semibold text-white ${won ? "bg-[var(--site-success-emphasis)]" : "bg-[var(--site-danger)]"}`}
        >
          {won ? "You won!" : "Game over"}
        </div>
        <div className="space-y-4 p-6">
          <div className="gh-box px-4 py-3 text-center">
            <p className="text-xs uppercase tracking-wide text-site-muted">
              The word was
            </p>
            <p className="mt-1 text-2xl font-semibold capitalize text-site-text">
              {answer}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="gh-box px-3 py-3 text-center">
              <p className="text-xs uppercase text-site-muted">Guesses</p>
              <p className="mt-1 text-2xl font-semibold text-site-text">
                {guesses}
              </p>
            </div>
            <div className="gh-box px-3 py-3 text-center">
              <p className="text-xs uppercase text-site-muted">Hints</p>
              <p className="mt-1 text-2xl font-semibold text-site-text">
                {hints}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 border-t border-site-border p-4">
          <button
            type="button"
            onClick={() => void handleShare()}
            className="gh-btn-default flex-1 px-4 py-2 text-sm"
          >
            Share
          </button>
          <button
            type="button"
            onClick={onClose}
            className="gh-btn-primary flex-1 px-4 py-2 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
