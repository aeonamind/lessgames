import { getGameDay } from "@/shared/lib/daily";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ gameDay: getGameDay() });
}
