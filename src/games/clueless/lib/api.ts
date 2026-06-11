import type { DailyResponse, GuessResult } from "@/games/clueless/lib/types";

export async function fetchDaily(): Promise<DailyResponse> {
  const response = await fetch("/api/clueless/daily");
  if (!response.ok) {
    throw new Error("Failed to load daily puzzle");
  }
  return response.json() as Promise<DailyResponse>;
}

export async function submitGuess(word: string): Promise<GuessResult> {
  const response = await fetch("/api/clueless/guess", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word }),
  });

  const data = (await response.json()) as GuessResult & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to process guess");
  }

  return data;
}

export async function requestHint(
  words: string[],
  distances: number[],
  giveUp = false,
): Promise<GuessResult> {
  const response = await fetch("/api/clueless/hint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ words, distances, giveUp }),
  });

  const data = (await response.json()) as GuessResult & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to get hint");
  }

  return data;
}
