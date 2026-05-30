import { riskThresholds } from "@/config/scoring";
import type { MarketSnapshotView } from "@/types/market";
import type { NewsArticleView } from "@/types/news";
import type { RiskLevel } from "@/types/prediction";
import type { SocialTrendView } from "@/types/social";
import { clamp } from "@/lib/utils";

export type RiskInput = {
  market: MarketSnapshotView;
  social: SocialTrendView;
  news: NewsArticleView[];
};

export function getRiskLevel(score: number): RiskLevel {
  if (score >= riskThresholds.high) return "EXTREME";
  if (score >= riskThresholds.medium) return "HIGH";
  if (score >= riskThresholds.low) return "MEDIUM";
  return "LOW";
}

export function calculateRiskScore({ market, social, news }: RiskInput) {
  const sellPressure = market.txnsSell24h / Math.max(1, market.txnsBuy24h + market.txnsSell24h);
  const spamRate = social.spamCount / Math.max(1, social.totalMentions);
  const liquidityStress = clamp(market.volume24h / Math.max(1, market.liquidityUsd) - 0.15, 0, 1);
  const negativeNews = news.filter((article) => article.impact === "negative");
  const negativeNewsPressure = clamp(
    negativeNews.reduce((sum, article) => sum + Math.abs(article.impactScore ?? 0) * article.relevanceScore, 0) /
      Math.max(1, news.length),
    0,
    1
  );
  const priceShock = clamp(Math.abs(Math.min(0, market.priceChange24h)) / 30, 0, 1);

  const riskScore = clamp(
    sellPressure * 0.28 + spamRate * 0.18 + liquidityStress * 0.22 + negativeNewsPressure * 0.22 + priceShock * 0.1
  );

  const reasons: string[] = [];
  if (sellPressure > 0.55) reasons.push("Sell transactions exceed buy transactions over the last 24h.");
  if (spamRate > 0.12) reasons.push("Social spam rate is elevated and may distort sentiment.");
  if (liquidityStress > 0.3) reasons.push("Volume is high relative to liquidity, increasing slippage sensitivity.");
  if (negativeNewsPressure > 0.25) reasons.push("Relevant negative news is pressuring the signal.");
  if (priceShock > 0.2) reasons.push("Recent downside price movement is large enough to increase risk.");

  return {
    riskScore,
    riskLevel: getRiskLevel(riskScore),
    reasons
  };
}
