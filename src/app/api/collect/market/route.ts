import { NextRequest, NextResponse } from "next/server";
import { guardCollector } from "@/app/api/collect/guard";
import { collectMarketSnapshot } from "@/services/market/market.service";

export async function GET(request: NextRequest) {
  const blocked = guardCollector(request);
  if (blocked) return blocked;
  const snapshot = await collectMarketSnapshot();
  return NextResponse.json({ ok: true, snapshot });
}
