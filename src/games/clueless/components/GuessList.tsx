"use client";

import type { GuessEntry } from "@/games/clueless/lib/types";
import { GuessBar } from "./GuessBar";

interface GuessListProps {
  guesses: GuessEntry[];
  markerDistance?: number | null;
}

export function GuessList({ guesses, markerDistance }: GuessListProps) {
  if (guesses.length === 0) return null;

  return (
    <div className="w-full space-y-2 py-4 pl-6">
      {guesses.map((guess, index) => (
        <GuessBar
          key={`${guess.word}-${index}`}
          guess={guess}
          highlight={markerDistance === guess.distance}
        />
      ))}
    </div>
  );
}
