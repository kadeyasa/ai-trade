import { getCoinGeckoApiKey } from "@/lib/admin-settings";
import type { CryptoAsset, MarketSeriesPoint, MarketSnapshotView } from "@/types/market";

type CoinGeckoMarket = {
  id?: string;
  symbol?: string;
  name?: string;
  image?: string;
  current_price?: number;
  market_cap?: number;
  market_cap_rank?: number;
  fully_diluted_valuation?: number;
  total_volume?: number;
  price_change_percentage_24h?: number;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_24h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
  sparkline_in_7d?: { price?: number[] };
};

const usdIdr = 16100;

function coinGeckoHeaders(): HeadersInit {
  const apiKey = getCoinGeckoApiKey();
  return apiKey ? { "x-cg-demo-api-key": apiKey } : {};
}

async function fetchCoinGeckoMarketPage(page: number) {
  const params = new URLSearchParams({
    vs_currency: "usd",
    order: "market_cap_desc",
    per_page: "250",
    page: String(page),
    sparkline: "true",
    price_change_percentage: "1h,24h,7d"
  });
  const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?${params}`, {
    headers: coinGeckoHeaders(),
    next: { revalidate: 120 }
  });
  if (!response.ok) throw new Error(`CoinGecko failed with ${response.status}`);

  return (await response.json()) as CoinGeckoMarket[];
}

async function fetchCoinGeckoMarkets(pages = 1) {
  const pageNumbers = Array.from({ length: pages }, (_, index) => index + 1);
  const chunks = await Promise.all(pageNumbers.map((page) => fetchCoinGeckoMarketPage(page)));
  return chunks.flat();
}

export async function fetchCryptoAssets(): Promise<CryptoAsset[]> {
  const rows = await fetchCoinGeckoMarkets(1);
  return rows.map(toCryptoAsset);
}

function toCryptoAsset(row: CoinGeckoMarket): CryptoAsset {
  return {
    id: row.id ?? row.symbol ?? row.name ?? "unknown",
    symbol: row.symbol?.toUpperCase() ?? "-",
    name: row.name ?? row.symbol?.toUpperCase() ?? "Unknown",
    image: row.image,
    currentPriceUsd: row.current_price ?? 0,
    marketCap: row.market_cap ?? null,
    marketCapRank: row.market_cap_rank ?? null,
    fdv: row.fully_diluted_valuation ?? null,
    volume24h: row.total_volume ?? 0,
    priceChange1h: row.price_change_percentage_1h_in_currency ?? null,
    priceChange24h: row.price_change_percentage_24h_in_currency ?? row.price_change_percentage_24h ?? 0,
    priceChange7d: row.price_change_percentage_7d_in_currency ?? null,
    sparkline7d: row.sparkline_in_7d?.price ?? []
  };
}

export async function fetchCoinGeckoAssetById(coinId: string) {
  const params = new URLSearchParams({
    vs_currency: "usd",
    ids: coinId,
    order: "market_cap_desc",
    per_page: "1",
    page: "1",
    sparkline: "false"
  });
  const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?${params}`, {
    headers: coinGeckoHeaders(),
    next: { revalidate: 120 }
  });
  if (!response.ok) throw new Error(`CoinGecko asset failed with ${response.status}`);

  const [row] = (await response.json()) as CoinGeckoMarket[];
  return row ? toCryptoAsset(row) : null;
}

export async function fetchCoinGeckoMarket(symbol: string, coinId?: string) {
  const asset = coinId
    ? await fetchCoinGeckoAssetById(coinId)
    : (await fetchCoinGeckoMarkets()).map(toCryptoAsset).find((row) => row.symbol.toLowerCase() === symbol.toLowerCase());
  if (!asset?.currentPriceUsd) return null;

  return {
    priceUsd: asset.currentPriceUsd,
    priceIdr: asset.currentPriceUsd * usdIdr,
    liquidityUsd: asset.marketCap ?? 0,
    volume24h: asset.volume24h,
    marketCap: asset.marketCap ?? null,
    fdv: asset.fdv ?? null,
    txnsBuy24h: 0,
    txnsSell24h: 0,
    priceChange1h: 0,
    priceChange6h: 0,
    priceChange24h: asset.priceChange24h,
    createdAt: new Date().toISOString()
  } satisfies MarketSnapshotView;
}

export async function fetchCoinGeckoMarketById(coinId: string) {
  return fetchCoinGeckoMarket("", coinId);
}

export async function fetchCoinGeckoSeries(coinId: string): Promise<MarketSeriesPoint[]> {
  const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=1`, {
    headers: coinGeckoHeaders(),
    next: { revalidate: 120 }
  });
  if (!response.ok) throw new Error(`CoinGecko chart failed with ${response.status}`);

  const data = (await response.json()) as {
    prices?: Array<[number, number]>;
    total_volumes?: Array<[number, number]>;
    market_caps?: Array<[number, number]>;
  };

  const volumes = data.total_volumes ?? [];
  const marketCaps = data.market_caps ?? [];
  return (data.prices ?? []).slice(-24).map(([timestamp, price], index) => ({
    time: new Date(timestamp).toISOString(),
    priceUsd: price,
    liquidityUsd: marketCaps[index]?.[1] ?? 0,
    volume24h: volumes[index]?.[1] ?? 0
  }));
}
