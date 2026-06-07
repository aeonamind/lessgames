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
        <p className="text-zinc-500">Loading...</p>
      </div>
    ),
  },
);
