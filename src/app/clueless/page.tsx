import { CluelessGameLoader } from "@/games/clueless/components/GameLoader";
import { cluelessConfig } from "@/games/clueless/config";
import { GameShell } from "@/shared/components/GameShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: cluelessConfig.name,
  description: cluelessConfig.description,
};

export default function CluelessPage() {
  return (
    <GameShell title={cluelessConfig.name}>
      <CluelessGameLoader />
    </GameShell>
  );
}
