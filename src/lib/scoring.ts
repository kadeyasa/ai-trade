import { scoringWeights } from "@/config/scoring";
import type { MarketSnapshotView } from "@/types/market";
import type { NewsArticleView } from "@/types/news";
import type { PredictionSnapshotView, Signal } from "@/types/prediction";
import type { SocialTrendView } from "@/types/social";
import { calculateRiskScore } from "@/lib/risk";
import { clamp } from "@/lib/utils";

export type ScoringInput = {
  market: MarketSnapshotView;
  social: SocialTrendView;
  news: NewsArticleView[];
};

function normalizeChange(changePercent: number, divisor = 20) {
  return clamp((changePercent / divisor + 1) / 2);
}

export function scoreMarketMomentum(market: MarketSnapshotView) {
  const buyRatio = market.txnsBuy24h / Math.max(1, market.txnsBuy24h + market.txnsSell24h);
  const momentum =
    normalizeChange(market.priceChange1h, 10) * 0.2 +
    normalizeChange(market.priceChange6h, 16) * 0.25 +
    normalizeChange(market.priceChange24h, 24) * 0.3 +
    clamp(market.volume24h / Math.max(1, market.liquidityUsd), 0, 1) * 0.1 +
    buyRatio * 0.15;
  return clamp(momentum);
}

export function scoreSocialSentiment(social: SocialTrendView) {
  const realMentions = Math.max(1, social.totalMentions - social.spamCount);
  const sentimentBalance = (social.positiveCount - social.negativeCount) / realMentions;
  const spamPenalty = social.spamCount / Math.max(1, social.totalMentions);
  return clamp(0.5 + sentimentBalance * 0.35 + social.trendVelocityScore * 0.25 - spamPenalty * 0.4);
}

export function scoreNewsImpact(news: NewsArticleView[]) {
  if (!news.length) return 0.5;
  const weightedImpact =
    news.reduce((sum, article) => sum + (article.impactScore ?? 0) * article.relevanceScore, 0) /
    Math.max(1, news.length);
  return clamp(0.5 + weightedImpact);
}

export function scoreLiquidityHealth(market: MarketSnapshotView) {
  const liquiditySize = clamp(Math.log10(Math.max(10, market.liquidityUsd)) / 7);
  const volumeLiquidityRatio = market.volume24h / Math.max(1, market.liquidityUsd);
  const slippagePenalty = clamp(volumeLiquidityRatio - 0.25, 0, 1);
  const fdvSupport = market.fdv ? clamp(market.liquidityUsd / Math.max(1, market.fdv) * 20) : 0.5;
  return clamp(liquiditySize * 0.45 + fdvSupport * 0.25 + (1 - slippagePenalty) * 0.3);
}

export function createPrediction({ market, social, news }: ScoringInput): PredictionSnapshotView {
  const marketScore = scoreMarketMomentum(market);
  const socialScore = scoreSocialSentiment(social);
  const newsScore = scoreNewsImpact(news);
  const liquidityScore = scoreLiquidityHealth(market);
  const risk = calculateRiskScore({ market, social, news });
  const riskAdjustmentScore = 1 - risk.riskScore;
  const whaleScore = clamp(1 - market.txnsSell24h / Math.max(1, market.txnsBuy24h + market.txnsSell24h));

  const tokenSignalScore = clamp(
    marketScore * scoringWeights.marketMomentum +
      socialScore * scoringWeights.socialSentiment +
      newsScore * scoringWeights.newsImpact +
      liquidityScore * scoringWeights.liquidityHealth +
      riskAdjustmentScore * scoringWeights.riskAdjustment
  );

  const bearishBase = clamp((1 - tokenSignalScore) * 0.68 + risk.riskScore * 0.32);
  const sidewaysBase = clamp(1 - Math.abs(tokenSignalScore - 0.5) * 1.9);
  const bullishBase = clamp(tokenSignalScore * (1 - risk.riskScore * 0.45));
  const total = Math.max(0.001, bullishBase + bearishBase + sidewaysBase * 0.55);

  const bullishProbability = bullishBase / total;
  const bearishProbability = bearishBase / total;
  const sidewaysProbability = (sidewaysBase * 0.55) / total;
  const confidence = clamp(
    Math.max(bullishProbability, bearishProbability, sidewaysProbability) * 0.65 +
      (1 - Math.abs(0.5 - tokenSignalScore)) * 0.2 +
      (1 - risk.riskScore) * 0.15
  );

  let signal: Signal = "SIDEWAYS";
  if (risk.riskLevel === "EXTREME" || risk.riskScore > 0.78) {
    signal = "HIGH_RISK";
  } else if (bullishProbability > bearishProbability && bullishProbability > sidewaysProbability) {
    signal = "BULLISH";
  } else if (bearishProbability > bullishProbability && bearishProbability > sidewaysProbability) {
    signal = "BEARISH";
  }

  const reasons = [
    marketScore > 0.58
      ? "Market momentum is constructive across price change and buy/sell activity."
      : "Market momentum is mixed or weak across recent price windows.",
    socialScore > 0.58
      ? "Social sentiment is net positive after spam filtering."
      : "Social sentiment is neutral to negative after spam filtering.",
    newsScore > 0.55
      ? "Recent relevant news has a positive weighted impact."
      : "Recent relevant news is neutral or carries negative pressure.",
    liquidityScore > 0.55
      ? "Liquidity depth is adequate for current volume."
      : "Liquidity health is below target for current activity.",
    ...risk.reasons
  ];

  return {
    bullishProbability,
    bearishProbability,
    sidewaysProbability,
    confidence,
    signal,
    riskLevel: risk.riskLevel,
    riskScore: risk.riskScore,
    reasons,
    marketScore,
    socialScore,
    newsScore,
    liquidityScore,
    whaleScore,
    createdAt: new Date().toISOString()
  };
}
