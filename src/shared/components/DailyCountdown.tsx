"use client";

import {
  formatCountdown,
  getGameDay,
  getMsUntilNextShuffle,
} from "@/shared/lib/daily";
import { useEffect, useState } from "react";

interface DailyCountdownProps {
  nextLabel?: string;
}

export function DailyCountdown({
  nextLabel = "Next puzzle in",
}: DailyCountdownProps) {
  const [countdown, setCountdown] = useState("");
  const [gameDay, setGameDay] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setGameDay(getGameDay(now));
      setCountdown(formatCountdown(getMsUntilNextShuffle(now)));
    };

    tick();
    const id = setInterval(tick, 1000);

    const onVisibility = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
      <p>Puzzle #{gameDay.replace(/-/g, "")}</p>
      <p>
        {nextLabel} {countdown}
      </p>
    </div>
  );
}
