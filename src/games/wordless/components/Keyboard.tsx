"use client";

import type { KeyState } from "@/games/wordless/lib/types";

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

function keyBg(state: KeyState): string {
  switch (state) {
    case "correct":
      return "#6aaa64";
    case "present":
      return "#c9b458";
    case "absent":
      return "#787c7e";
    default:
      return "#d3d6da";
  }
}

function keyText(state: KeyState): string {
  return state === "unused" || state === "absent" ? "#1a1a1b" : "#ffffff";
}

interface KeyboardProps {
  keyStates: Record<string, KeyState>;
  onKey: (key: string) => void;
  disabled?: boolean;
}

export function Keyboard({ keyStates, onKey, disabled }: KeyboardProps) {
  return (
    <div className="flex w-full max-w-[500px] flex-col gap-[8px] px-2">
      {ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-[6px]">
          {row.map((key) => {
            const state = keyStates[key] ?? "unused";
            const isWide = key === "ENTER" || key === "⌫";

            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => onKey(key === "⌫" ? "Backspace" : key)}
                className={`flex h-[58px] items-center justify-center rounded font-bold uppercase select-none transition-colors active:scale-95 disabled:opacity-60 ${isWide ? "px-3 text-xs sm:text-sm" : "w-[43px] text-sm"}`}
                style={{
                  backgroundColor: keyBg(state),
                  color: keyText(state),
                  minWidth: isWide ? undefined : 43,
                  flex: isWide ? 1.5 : undefined,
                }}
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
