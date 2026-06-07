"use client";

import dynamic from "next/dynamic";

export const WordlessGameLoader = dynamic(
  () =>
    import("@/games/wordless/components/WordlessGame").then(
      (m) => m.WordlessGame,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 items-center justify-center py-24">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-site-border border-t-site-accent" />
      </div>
    ),
  },
);
