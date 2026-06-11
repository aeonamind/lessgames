"use client";

import dynamic from "next/dynamic";

export const CluelessGameLoader = dynamic(
  () =>
    import("@/games/clueless/components/CluelessGame").then(
      (m) => m.CluelessGame,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-site-border border-t-site-accent" />
      </div>
    ),
  },
);
