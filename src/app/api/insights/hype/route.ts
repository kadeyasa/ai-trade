import { NextResponse } from "next/server";
import { getHypeMarketInsight } from "@/services/insights/hype.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const insight = await getHypeMarketInsight();
  return NextResponse.json({ insight });
}
