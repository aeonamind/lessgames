import { cluelessConfig } from "@/games/clueless/config";
import { ComingSoon } from "@/shared/components/ComingSoon";
import { GameShell } from "@/shared/components/GameShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: cluelessConfig.name,
  description: cluelessConfig.description,
};

export default function CluelessPage() {
  return (
    <GameShell>
      <ComingSoon
        name={cluelessConfig.name}
        description={cluelessConfig.description}
      />
    </GameShell>
  );
}
