import { getDailyWord, getDailyWords } from "@/games/wordless/lib/server/word-provider";
import { wordlessConfig } from "@/games/wordless/config";
import { getGameDay } from "@/shared/lib/daily";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lengthParam = searchParams.get("length");
  const gameDay = getGameDay();

  try {
    if (lengthParam === null) {
      const daily = await getDailyWords(gameDay);
      return NextResponse.json(daily);
    }

    const length = Number(lengthParam);
    if (
      !Number.isInteger(length) ||
      length < wordlessConfig.minLength ||
      length > wordlessConfig.maxLength
    ) {
      return NextResponse.json({ error: "Invalid length" }, { status: 400 });
    }

    const word = await getDailyWord(length, gameDay);
    return NextResponse.json({ gameDay, length, word });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load daily word";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
