export type MarketSnapshotView = {
  id?: string;
  tokenConfigId?: string;
  priceUsd: number;
  priceIdr: number;
  liquidityUsd: number;
  volume24h: number;
  marketCap?: number | null;
  fdv?: number | null;
  txnsBuy24h: number;
  txnsSell24h: number;
  priceChange1h: number;
  priceChange6h: number;
  priceChange24h: number;
  createdAt: string;
};

export type MarketSeriesPoint = {
  time: string;
  priceUsd: number;
  liquidityUsd: number;
  volume24h: number;
};

export type CryptoAsset = {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  currentPriceUsd: number;
  marketCap?: number | null;
  marketCapRank?: number | null;
  fdv?: number | null;
  volume24h: number;
  priceChange1h?: number | null;
  priceChange24h: number;
  priceChange7d?: number | null;
  sparkline7d?: number[];
};
