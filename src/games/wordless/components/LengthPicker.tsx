"use client";

import type { WordlessState } from "@/games/wordless/lib/types";

interface LengthPickerProps {
  lengths: readonly number[];
  activeLength: number;
  puzzles: Record<number, WordlessState>;
  onSelect: (length: number) => void;
}

export function LengthPicker({
  lengths,
  activeLength,
  puzzles,
  onSelect,
}: LengthPickerProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {lengths.map((length) => {
        const status = puzzles[length].status;
        const isActive = length === activeLength;

        return (
          <button
            key={length}
            type="button"
            onClick={() => onSelect(length)}
            className={`relative flex h-10 min-w-10 items-center justify-center rounded-lg px-3 text-sm font-semibold transition-all duration-150 ${
              isActive
                ? "bg-site-accent text-white shadow-sm"
                : "border border-site-border bg-site-surface text-site-text hover:border-site-accent/50 hover:bg-site-accent-soft"
            }`}
          >
            {length}
            {status === "won" && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--tile-correct)] text-[9px] text-white">
                ✓
              </span>
            )}
            {status === "lost" && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--tile-absent)] text-[9px] text-white">
                ✕
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
