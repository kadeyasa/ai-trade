import { NextResponse } from "next/server";
import { getCryptoAssets } from "@/services/market/market.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getCryptoAssets();
  return NextResponse.json(result);
}
