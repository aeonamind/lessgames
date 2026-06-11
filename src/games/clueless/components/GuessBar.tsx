"use client";

import type { GuessEntry } from "@/games/clueless/lib/types";
import {
  distanceColor,
  distanceToProgress,
} from "@/games/clueless/lib/engine";
import { useEffect, useState } from "react";

interface GuessBarProps {
  guess: GuessEntry;
  highlight?: boolean;
}

export function GuessBar({ guess, highlight = false }: GuessBarProps) {
  const targetProgress = distanceToProgress(guess.distance);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setProgress(targetProgress));
    return () => cancelAnimationFrame(frame);
  }, [targetProgress]);

  const duration = Math.max(200, 15 * targetProgress);

  return (
    <div className="relative h-10 w-full overflow-hidden rounded-md bg-site-canvas-subtle sm:h-12">
      <div
        className="absolute inset-y-0 left-0 rounded-md transition-[width] ease-out"
        style={{
          width: `${progress}%`,
          backgroundColor: distanceColor(guess.distance),
          transitionDuration: `${duration}ms`,
          transitionTimingFunction: "cubic-bezier(0.25, 1, 0.5, 1)",
        }}
      />
      <div className="relative z-10 flex h-full items-center justify-between px-4">
        <p className="flex items-center gap-1.5 text-base font-medium capitalize tracking-wide text-site-text sm:text-lg">
          {guess.isHint && (
            <span className="text-sm" aria-hidden>
              {guess.distance === 1 ? "🏳️" : "💡"}
            </span>
          )}
          {guess.word}
        </p>
        <span className="text-base font-medium text-site-text sm:text-lg">
          {guess.distance}
        </span>
      </div>
      {highlight && (
        <span
          className="absolute -left-6 top-1/2 -translate-y-1/2 text-white"
          aria-hidden
        >
          ▼
        </span>
      )}
    </div>
  );
}
