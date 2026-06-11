import { resolveHint } from "@/games/clueless/lib/server/similarity";
import { getGameDay } from "@/shared/lib/daily";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      distances?: number[];
      words?: string[];
      giveUp?: boolean;
    };

    const distances = Array.isArray(body.distances) ? body.distances : [];
    const words = Array.isArray(body.words) ? body.words : [];
    const giveUp = body.giveUp === true;

    const result = await resolveHint(words, distances, giveUp, getGameDay());
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get hint";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
