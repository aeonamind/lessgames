import type { DailyWordsResponse } from "@/games/wordless/lib/types";

export async function fetchDailyWords(): Promise<DailyWordsResponse> {
  const response = await fetch("/api/wordless/daily");
  if (!response.ok) {
    throw new Error("Failed to load daily words");
  }
  return response.json() as Promise<DailyWordsResponse>;
}

export async function validateWord(
  word: string,
  length: number,
): Promise<boolean> {
  const response = await fetch("/api/wordless/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word, length }),
  });

  if (!response.ok) {
    return false;
  }

  const data = (await response.json()) as { valid: boolean };
  return data.valid;
}
