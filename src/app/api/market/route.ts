import { NextRequest, NextResponse } from "next/server";
import { getCoinAnalysisMarket, getCoinAnalysisSeries, getMarketSeries, getMarketSnapshot } from "@/services/market/market.service";

export async function GET(request: NextRequest) {
  const coinId = request.nextUrl.searchParams.get("coinId");
  const [snapshot, series] = coinId
    ? await Promise.all([getCoinAnalysisMarket(coinId), getCoinAnalysisSeries(coinId)])
    : await Promise.all([getMarketSnapshot(), getMarketSeries()]);
  return NextResponse.json({ snapshot, series });
}
