"use client";

import type { KeyState } from "@/games/wordless/lib/types";

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

function keyClasses(state: KeyState, isWide: boolean): string {
  const base =
    "flex h-14 items-center justify-center rounded-md font-semibold uppercase select-none transition-colors duration-150 active:scale-95 disabled:opacity-50";

  const size = isWide
    ? "px-2 text-[10px] sm:px-3 sm:text-xs flex-[1.4]"
    : "w-8 text-xs sm:w-10 sm:text-sm";

  const tone =
    state === "correct"
      ? "bg-[var(--tile-correct)] text-white"
      : state === "present"
        ? "bg-[var(--tile-present)] text-white"
        : state === "absent"
          ? "bg-[var(--tile-absent)] text-white"
          : "bg-[#d3d6da] text-site-text hover:bg-[#c9ccd0]";

  return `${base} ${size} ${tone}`;
}

interface KeyboardProps {
  keyStates: Record<string, KeyState>;
  onKey: (key: string) => void;
  disabled?: boolean;
}

export function Keyboard({ keyStates, onKey, disabled }: KeyboardProps) {
  return (
    <div className="flex w-full max-w-xl flex-col gap-1.5 px-1">
      {ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1.5">
          {row.map((key) => {
            const state = keyStates[key] ?? "unused";
            const isWide = key === "ENTER" || key === "⌫";

            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => onKey(key === "⌫" ? "Backspace" : key)}
                className={keyClasses(state, isWide)}
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
