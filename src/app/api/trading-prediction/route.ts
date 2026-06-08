import { NextRequest, NextResponse } from "next/server";
import { getCoinAnalysisSeries, getCryptoAssetById } from "@/services/market/market.service";
import { getTradingPrediction } from "@/services/prediction/trading-prediction.service";

export async function GET(request: NextRequest) {
  const coinId = request.nextUrl.searchParams.get("coinId") ?? "bitcoin";
  const timeframe = request.nextUrl.searchParams.get("timeframe") ?? "1h";
  const asset = await getCryptoAssetById(coinId);
  const series = await getCoinAnalysisSeries(coinId, timeframe);
  const prediction = await getTradingPrediction({
    symbol: asset?.symbol ?? coinId.toUpperCase(),
    timeframe,
    series
  });

  return NextResponse.json({ prediction });
}
