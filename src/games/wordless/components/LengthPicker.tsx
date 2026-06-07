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
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {lengths.map((length) => {
        const status = puzzles[length].status;
        const isActive = length === activeLength;

        return (
          <button
            key={length}
            type="button"
            onClick={() => onSelect(length)}
            className={`relative min-w-[2.25rem] rounded-md px-2.5 py-1.5 text-sm font-medium transition ${
              isActive
                ? "gh-btn-primary"
                : "gh-btn-default"
            }`}
          >
            {length}
            {status === "won" && (
              <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--tile-correct)] text-[8px] text-white">
                ✓
              </span>
            )}
            {status === "lost" && (
              <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--tile-absent)] text-[8px] text-white">
                ✕
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
