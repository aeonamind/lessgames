"use client";

import type { Tile } from "@/games/wordless/lib/types";

interface TileProps {
  tile: Tile;
  wordLength: number;
  animate?: boolean;
  delay?: number;
}

function tileSizeClass(wordLength: number): string {
  if (wordLength <= 4) return "h-14 w-14 text-2xl sm:h-16 sm:w-16 sm:text-3xl";
  if (wordLength <= 6) return "h-12 w-12 text-xl sm:h-14 sm:w-14 sm:text-2xl";
  return "h-10 w-10 text-lg sm:h-11 sm:w-11 sm:text-xl";
}

export function TileCell({
  tile,
  wordLength,
  animate = false,
  delay = 0,
}: TileProps) {
  const isRevealed =
    tile.state === "correct" ||
    tile.state === "present" ||
    tile.state === "absent";

  const stateClass =
    tile.state === "correct"
      ? "border-transparent bg-[var(--tile-correct)] text-[var(--tile-text-revealed)]"
      : tile.state === "present"
        ? "border-transparent bg-[var(--tile-present)] text-[var(--tile-text-revealed)]"
        : tile.state === "absent"
          ? "border-transparent bg-[var(--tile-absent)] text-[var(--tile-text-revealed)]"
          : tile.letter
            ? "border-[var(--tile-filled-border)] bg-[var(--tile-empty)] text-[var(--tile-text)]"
            : "border-[var(--tile-border)] bg-[var(--tile-empty)] text-[var(--tile-text)]";

  return (
    <div
      className={`flex items-center justify-center rounded-sm border-2 font-bold uppercase select-none transition-colors duration-200 ${tileSizeClass(wordLength)} ${stateClass} ${animate ? "animate-flip" : tile.letter && !isRevealed ? "animate-pop" : ""}`}
      style={{ animationDelay: animate ? `${delay}ms` : undefined }}
    >
      {tile.letter}
    </div>
  );
}
