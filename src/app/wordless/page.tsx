import { WordlessGameLoader } from "@/games/wordless/components/GameLoader";
import { GameShell } from "@/shared/components/GameShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wordless",
  description:
    "Guess the hidden 5-letter word in 6 tries. A new word every day at 3:00 AM GMT+7.",
};

export default function WordlessPage() {
  return (
    <GameShell>
      <WordlessGameLoader />
    </GameShell>
  );
}
