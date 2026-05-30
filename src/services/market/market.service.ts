import { tokenConfig } from "@/config/token";
import { isMockMode } from "@/lib/env";
import { mockCryptoAssets, mockMarket, mockMarketSeries } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import type { CryptoAsset, MarketSeriesPoint, MarketSnapshotView } from "@/types/market";
import { fetchCoinGeckoAssetById, fetchCoinGeckoMarket, fetchCoinGeckoMarketById, fetchCoinGeckoSeries, fetchCryptoAssets } from "@/services/market/coingecko";
import { fetchDexScreenerMarket } from "@/services/market/dexscreener";

function dbToMarket(row: {
  id: string;
  tokenConfigId: string;
  priceUsd: unknown;
  priceIdr: unknown;
  liquidityUsd: unknown;
  volume24h: unknown;
  marketCap: unknown | null;
  fdv: unknown | null;
  txnsBuy24h: number;
  txnsSell24h: number;
  priceChange1h: unknown;
  priceChange6h: unknown;
  priceChange24h: unknown;
  createdAt: Date;
}): MarketSnapshotView {
  return {
    id: row.id,
    tokenConfigId: row.tokenConfigId,
    priceUsd: Number(row.priceUsd),
    priceIdr: Number(row.priceIdr),
    liquidityUsd: Number(row.liquidityUsd),
    volume24h: Number(row.volume24h),
    marketCap: row.marketCap == null ? null : Number(row.marketCap),
    fdv: row.fdv == null ? null : Number(row.fdv),
    txnsBuy24h: row.txnsBuy24h,
    txnsSell24h: row.txnsSell24h,
    priceChange1h: Number(row.priceChange1h),
    priceChange6h: Number(row.priceChange6h),
    priceChange24h: Number(row.priceChange24h),
    createdAt: row.createdAt.toISOString()
  };
}

export async function getMarketSnapshot(): Promise<MarketSnapshotView> {
  if (isMockMode()) return mockMarket;
  const latest = await prisma.marketSnapshot.findFirst({ orderBy: { createdAt: "desc" } });
  if (latest) return dbToMarket(latest);
  return collectMarketSnapshot();
}

export async function getCryptoAssets(): Promise<{ assets: CryptoAsset[]; isFallback: boolean }> {
  try {
    const assets = await fetchCryptoAssets();
    return { assets, isFallback: false };
  } catch {
    return { assets: mockCryptoAssets, isFallback: true };
  }
}

export async function getCryptoAssetById(coinId: string): Promise<CryptoAsset | null> {
  return (await fetchCoinGeckoAssetById(coinId).catch(() => null)) ?? mockCryptoAssets.find((asset) => asset.id === coinId) ?? null;
}

export async function getCoinAnalysisMarket(coinId: string): Promise<MarketSnapshotView> {
  if (!coinId) return getMarketSnapshot();
  return (await fetchCoinGeckoMarketById(coinId).catch(() => null)) ?? mockMarket;
}

export async function getCoinAnalysisSeries(coinId: string): Promise<MarketSeriesPoint[]> {
  if (!coinId) return getMarketSeries();
  return (await fetchCoinGeckoSeries(coinId).catch(() => null)) ?? mockMarketSeries;
}

export async function getMarketSeries(): Promise<MarketSeriesPoint[]> {
  if (isMockMode()) return mockMarketSeries;
  const rows = await prisma.marketSnapshot.findMany({
    orderBy: { createdAt: "asc" },
    take: 24
  });
  return rows.map((row) => ({
    time: row.createdAt.toISOString(),
    priceUsd: Number(row.priceUsd),
    liquidityUsd: Number(row.liquidityUsd),
    volume24h: Number(row.volume24h)
  }));
}

export async function collectMarketSnapshot(): Promise<MarketSnapshotView> {
  if (isMockMode()) return mockMarket;
  const market =
    (await fetchDexScreenerMarket(tokenConfig.pairAddress ?? undefined, tokenConfig.contractAddress).catch(() => null)) ??
    (await fetchCoinGeckoMarket(tokenConfig.symbol).catch(() => null)) ??
    mockMarket;

  const token = await prisma.tokenConfig.upsert({
    where: { id: tokenConfig.id },
    create: tokenConfig,
    update: tokenConfig
  });

  const created = await prisma.marketSnapshot.create({
    data: {
      tokenConfigId: token.id,
      priceUsd: market.priceUsd,
      priceIdr: market.priceIdr,
      liquidityUsd: market.liquidityUsd,
      volume24h: market.volume24h,
      marketCap: market.marketCap,
      fdv: market.fdv,
      txnsBuy24h: market.txnsBuy24h,
      txnsSell24h: market.txnsSell24h,
      priceChange1h: market.priceChange1h,
      priceChange6h: market.priceChange6h,
      priceChange24h: market.priceChange24h
    }
  });
  return dbToMarket(created);
}
