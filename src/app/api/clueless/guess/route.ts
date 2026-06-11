import {
  assertKnownWord,
  resolveGuess,
} from "@/games/clueless/lib/server/similarity";
import { getGameDay } from "@/shared/lib/daily";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { word?: string };
    const word = body.word?.trim();

    if (!word) {
      return NextResponse.json({ error: "Word too short" }, { status: 400 });
    }

    await assertKnownWord(word);
    const result = await resolveGuess(word, getGameDay());
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "WORD_NOT_FOUND") {
      return NextResponse.json(
        { error: "Sorry, we don't know this word" },
        { status: 404 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to process guess";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
