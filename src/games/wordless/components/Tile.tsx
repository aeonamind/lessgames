"use client";

import { TILE_COLORS } from "@/games/wordless/config";
import type { Tile } from "@/games/wordless/lib/types";

interface TileProps {
  tile: Tile;
  animate?: boolean;
  delay?: number;
}

export function TileCell({ tile, animate = false, delay = 0 }: TileProps) {
  const isRevealed =
    tile.state === "correct" ||
    tile.state === "present" ||
    tile.state === "absent";

  const bg =
    tile.state === "correct"
      ? TILE_COLORS.correct
      : tile.state === "present"
        ? TILE_COLORS.present
        : tile.state === "absent"
          ? TILE_COLORS.absent
          : tile.letter
            ? TILE_COLORS.filled
            : TILE_COLORS.empty;

  const borderColor =
    isRevealed || tile.letter ? "transparent" : TILE_COLORS.border;

  const textColor = isRevealed ? "#ffffff" : "#1a1a1b";

  return (
    <div
      className={`flex h-[62px] w-[62px] items-center justify-center border-2 text-[2rem] font-bold uppercase select-none sm:h-[58px] sm:w-[58px] ${animate ? "animate-flip" : tile.letter && !isRevealed ? "animate-pop" : ""}`}
      style={{
        backgroundColor: bg,
        borderColor,
        color: textColor,
        animationDelay: animate ? `${delay}ms` : undefined,
      }}
    >
      {tile.letter}
    </div>
  );
}
