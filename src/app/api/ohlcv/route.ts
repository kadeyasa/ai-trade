import { NextRequest, NextResponse } from "next/server";
import { binanceKlineStreamUrl, fetchBinanceOhlcv, normalizeBinanceInterval, toBinanceSpotSymbol } from "@/services/market/binance";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol") ?? "BTC";
  const interval = normalizeBinanceInterval(request.nextUrl.searchParams.get("timeframe") ?? "1h");
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "240");
  const binanceSymbol = toBinanceSpotSymbol(symbol);
  const candles = await fetchBinanceOhlcv({ symbol: binanceSymbol, interval, limit });

  return NextResponse.json({
    provider: "binance",
    symbol: binanceSymbol,
    interval,
    websocketUrl: binanceKlineStreamUrl(binanceSymbol, interval),
    candles
  });
}
