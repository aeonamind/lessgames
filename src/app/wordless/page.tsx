import { WordlessGameLoader } from "@/games/wordless/components/GameLoader";
import { GameShell } from "@/shared/components/GameShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wordless",
  description:
    "Six daily word puzzles from 3 to 8 letters. Valid English words, new shuffle at 3:00 AM GMT+7.",
};

export default function WordlessPage() {
  return (
    <GameShell>
      <WordlessGameLoader />
    </GameShell>
  );
}
