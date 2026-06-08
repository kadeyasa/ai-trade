import { env } from "@/lib/env";
import { aggregateOhlcvByTimeframe, createTradingPrediction, marketSeriesToOhlcv } from "@/lib/trading-prediction";
import { fetchBinanceOhlcv } from "@/services/market/binance";
import type { MarketSeriesPoint } from "@/types/market";
import type { OhlcvCandle, TradingPrediction } from "@/types/trading-prediction";

async function fetchBackendPrediction(input: { symbol: string; timeframe: string; candles: OhlcvCandle[] }) {
  if (!env.FASTAPI_PREDICTION_URL) return null;

  try {
    const response = await fetch(`${env.FASTAPI_PREDICTION_URL.replace(/\/$/, "")}/predict`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      next: { revalidate: 60 }
    });
    if (!response.ok) return null;
    return (await response.json()) as TradingPrediction;
  } catch {
    return null;
  }
}

export async function getTradingPrediction(input: {
  symbol: string;
  timeframe?: string;
  series: MarketSeriesPoint[];
}): Promise<TradingPrediction> {
  const timeframe = input.timeframe ?? "1h";
  const candles =
    (await fetchBinanceOhlcv({ symbol: input.symbol, interval: timeframe, limit: 240 }).catch(() => null)) ??
    aggregateOhlcvByTimeframe(marketSeriesToOhlcv(input.series), timeframe);
  return (await fetchBackendPrediction({ symbol: input.symbol, timeframe, candles })) ?? createTradingPrediction({ symbol: input.symbol, timeframe, candles });
}
