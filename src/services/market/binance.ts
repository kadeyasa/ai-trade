import type { OhlcvCandle } from "@/types/trading-prediction";

const binanceRestBaseUrl = "https://api.binance.com";
const binanceWsBaseUrl = "wss://stream.binance.com:9443/ws";
const supportedIntervals = new Set(["15m", "1h", "4h", "1d"]);

type BinanceKlineRow = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string
];

export function toBinanceSpotSymbol(symbol: string) {
  const normalized = symbol.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (normalized.endsWith("USDT")) return normalized;
  return `${normalized}USDT`;
}

export function normalizeBinanceInterval(timeframe: string) {
  return supportedIntervals.has(timeframe) ? timeframe : "1h";
}

export function binanceKlineStreamUrl(symbol: string, interval: string) {
  return `${binanceWsBaseUrl}/${toBinanceSpotSymbol(symbol).toLowerCase()}@kline_${normalizeBinanceInterval(interval)}`;
}

export async function fetchBinanceOhlcv(input: { symbol: string; interval?: string; limit?: number }): Promise<OhlcvCandle[]> {
  const symbol = toBinanceSpotSymbol(input.symbol);
  const interval = normalizeBinanceInterval(input.interval ?? "1h");
  const limit = Math.min(1000, Math.max(20, input.limit ?? 240));
  const params = new URLSearchParams({ symbol, interval, limit: String(limit) });
  const response = await fetch(`${binanceRestBaseUrl}/api/v3/klines?${params}`, {
    next: { revalidate: 15 }
  });
  if (!response.ok) throw new Error(`Binance klines failed with ${response.status}`);

  const rows = (await response.json()) as BinanceKlineRow[];
  return rows.map((row) => ({
    time: new Date(row[0]).toISOString(),
    open: Number(row[1]),
    high: Number(row[2]),
    low: Number(row[3]),
    close: Number(row[4]),
    volume: Number(row[5])
  }));
}
