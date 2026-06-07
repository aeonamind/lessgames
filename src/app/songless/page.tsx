import { songlessConfig } from "@/games/songless/config";
import { ComingSoon } from "@/shared/components/ComingSoon";
import { GameShell } from "@/shared/components/GameShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: songlessConfig.name,
  description: songlessConfig.description,
};

export default function SonglessPage() {
  return (
    <GameShell title={songlessConfig.name}>
      <ComingSoon
        name={songlessConfig.name}
        description={songlessConfig.description}
      />
    </GameShell>
  );
}
