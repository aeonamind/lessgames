"use client";

import type { Tile } from "@/games/wordless/lib/types";
import { TileCell } from "./Tile";

interface BoardProps {
  rows: Tile[][];
  wordLength: number;
  shakeRow?: number;
  revealRow?: number;
}

export function Board({ rows, wordLength, shakeRow, revealRow }: BoardProps) {
  return (
    <div className="gh-box flex flex-col gap-1.5 p-4">
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={`flex justify-center gap-1.5 ${shakeRow === rowIndex ? "animate-shake" : ""}`}
        >
          {row.map((tile, colIndex) => (
            <TileCell
              key={colIndex}
              tile={tile}
              wordLength={wordLength}
              animate={revealRow === rowIndex}
              delay={colIndex * 300}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
