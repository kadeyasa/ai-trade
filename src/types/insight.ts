export type HypeCoinInsight = {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  rank?: number | null;
  priceUsd: number;
  marketCap?: number | null;
  volume24h: number;
  priceChange1h?: number | null;
  priceChange24h: number;
  priceChange7d?: number | null;
  hypeScore: number;
  longSetupScore: number;
  technicalScore: number;
  sentimentScore: number;
  newsCatalystScore: number;
  riskScore: number;
  signal: "STRONG_WATCH" | "WATCH" | "NEUTRAL" | "HIGH_RISK";
  technicalReasons: string[];
  sentimentReasons: string[];
  newsReasons: string[];
  riskReasons: string[];
};

export type HypeMarketInsight = {
  generatedAt: string;
  source: string;
  analyzedCount: number;
  candidates: HypeCoinInsight[];
  methodology: string[];
};
