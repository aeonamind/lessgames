"use client";

import type { Tile } from "@/games/wordless/lib/types";
import { TileCell } from "./Tile";

interface BoardProps {
  rows: Tile[][];
  shakeRow?: number;
  revealRow?: number;
}

export function Board({ rows, shakeRow, revealRow }: BoardProps) {
  return (
    <div className="flex flex-col gap-[5px]">
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={`flex gap-[5px] ${shakeRow === rowIndex ? "animate-shake" : ""}`}
        >
          {row.map((tile, colIndex) => (
            <TileCell
              key={colIndex}
              tile={tile}
              animate={revealRow === rowIndex}
              delay={colIndex * 300}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
