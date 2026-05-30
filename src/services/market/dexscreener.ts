import type { MarketSnapshotView } from "@/types/market";

type DexScreenerPair = {
  priceUsd?: string;
  liquidity?: { usd?: number };
  volume?: { h24?: number };
  marketCap?: number;
  fdv?: number;
  txns?: { h24?: { buys?: number; sells?: number } };
  priceChange?: { h1?: number; h6?: number; h24?: number };
};

export async function fetchDexScreenerMarket(pairAddress?: string, contractAddress?: string) {
  const lookup = pairAddress || contractAddress;
  if (!lookup) return null;

  const response = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${lookup}`, {
    next: { revalidate: 60 }
  });
  if (!response.ok) throw new Error(`DEX Screener failed with ${response.status}`);

  const data = (await response.json()) as { pairs?: DexScreenerPair[] };
  const pair = data.pairs?.[0];
  if (!pair) return null;

  const priceUsd = Number(pair.priceUsd ?? 0);
  const usdIdr = 16100;
  return {
    priceUsd,
    priceIdr: priceUsd * usdIdr,
    liquidityUsd: pair.liquidity?.usd ?? 0,
    volume24h: pair.volume?.h24 ?? 0,
    marketCap: pair.marketCap ?? null,
    fdv: pair.fdv ?? null,
    txnsBuy24h: pair.txns?.h24?.buys ?? 0,
    txnsSell24h: pair.txns?.h24?.sells ?? 0,
    priceChange1h: pair.priceChange?.h1 ?? 0,
    priceChange6h: pair.priceChange?.h6 ?? 0,
    priceChange24h: pair.priceChange?.h24 ?? 0,
    createdAt: new Date().toISOString()
  } satisfies MarketSnapshotView;
}
