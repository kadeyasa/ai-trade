import { isMockMode } from "@/lib/env";
import { mockPrediction } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import type { PredictionSnapshotView } from "@/types/prediction";
import { getMarketSnapshot } from "@/services/market/market.service";
import { getNewsArticles } from "@/services/news/news.service";
import { createPrediction } from "@/services/prediction/signal-engine";
import { getSocialTrend } from "@/services/social/social.service";

export async function getPrediction(): Promise<PredictionSnapshotView> {
  if (isMockMode()) {
    const market = await getMarketSnapshot();
    const social = await getSocialTrend();
    const news = await getNewsArticles();
    return createPrediction({ market, social, news });
  }

  const latest = await prisma.predictionSnapshot.findFirst({ orderBy: { createdAt: "desc" } });
  if (!latest) return collectPrediction();
  return {
    id: latest.id,
    bullishProbability: Number(latest.bullishProbability),
    bearishProbability: Number(latest.bearishProbability),
    sidewaysProbability: Number(latest.sidewaysProbability),
    confidence: Number(latest.confidence),
    signal: latest.signal as PredictionSnapshotView["signal"],
    riskLevel: latest.riskLevel as PredictionSnapshotView["riskLevel"],
    riskScore: Number(latest.riskScore),
    reasons: Array.isArray(latest.reasonsJson) ? (latest.reasonsJson as string[]) : [],
    marketScore: Number(latest.marketScore),
    socialScore: Number(latest.socialScore),
    newsScore: Number(latest.newsScore),
    liquidityScore: Number(latest.liquidityScore),
    whaleScore: Number(latest.whaleScore),
    createdAt: latest.createdAt.toISOString()
  };
}

export async function collectPrediction() {
  const market = await getMarketSnapshot();
  const social = await getSocialTrend();
  const news = await getNewsArticles();
  const prediction = createPrediction({ market, social, news });

  if (!isMockMode()) {
    await prisma.predictionSnapshot.create({
      data: {
        bullishProbability: prediction.bullishProbability,
        bearishProbability: prediction.bearishProbability,
        sidewaysProbability: prediction.sidewaysProbability,
        confidence: prediction.confidence,
        signal: prediction.signal,
        riskLevel: prediction.riskLevel,
        riskScore: prediction.riskScore,
        reasonsJson: prediction.reasons,
        marketScore: prediction.marketScore,
        socialScore: prediction.socialScore,
        newsScore: prediction.newsScore,
        liquidityScore: prediction.liquidityScore,
        whaleScore: prediction.whaleScore
      }
    });
  }

  return prediction;
}
