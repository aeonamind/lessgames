import { validateEnglishWord } from "@/games/wordless/lib/server/word-provider";
import { wordlessConfig } from "@/games/wordless/config";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { word?: string; length?: number };
    const word = body.word?.trim();

    if (!word) {
      return NextResponse.json({ error: "Word is required" }, { status: 400 });
    }

    const length = body.length ?? word.length;
    if (
      length < wordlessConfig.minLength ||
      length > wordlessConfig.maxLength ||
      word.length !== length
    ) {
      return NextResponse.json({ error: "Invalid length" }, { status: 400 });
    }

    const valid = await validateEnglishWord(word);
    return NextResponse.json({ valid });
  } catch {
    return NextResponse.json({ error: "Validation failed" }, { status: 502 });
  }
}
