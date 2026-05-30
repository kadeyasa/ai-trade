import { PrismaClient } from "@prisma/client";
import { tokenConfig } from "../src/config/token";
import { mockAlerts, mockMarket, mockNews, mockPrediction, mockSocialPosts, mockSocialTrend } from "../src/lib/mock-data";

const prisma = new PrismaClient();

async function main() {
  await prisma.tokenConfig.upsert({
    where: { id: tokenConfig.id },
    create: tokenConfig,
    update: tokenConfig
  });

  await prisma.marketSnapshot.create({
    data: {
      tokenConfigId: tokenConfig.id,
      priceUsd: mockMarket.priceUsd,
      priceIdr: mockMarket.priceIdr,
      liquidityUsd: mockMarket.liquidityUsd,
      volume24h: mockMarket.volume24h,
      marketCap: mockMarket.marketCap,
      fdv: mockMarket.fdv,
      txnsBuy24h: mockMarket.txnsBuy24h,
      txnsSell24h: mockMarket.txnsSell24h,
      priceChange1h: mockMarket.priceChange1h,
      priceChange6h: mockMarket.priceChange6h,
      priceChange24h: mockMarket.priceChange24h
    }
  });

  await Promise.all(
    mockSocialPosts.map((post) =>
      prisma.socialPost.upsert({
        where: { externalId: post.externalId },
        create: {
          ...post,
          createdAt: new Date(post.createdAt),
          analyzedAt: post.analyzedAt ? new Date(post.analyzedAt) : null
        },
        update: {}
      })
    )
  );

  await prisma.socialTrendSnapshot.create({
    data: {
      keyword: mockSocialTrend.keyword,
      totalMentions: mockSocialTrend.totalMentions,
      positiveCount: mockSocialTrend.positiveCount,
      negativeCount: mockSocialTrend.negativeCount,
      neutralCount: mockSocialTrend.neutralCount,
      spamCount: mockSocialTrend.spamCount,
      topTopicsJson: mockSocialTrend.topTopics,
      trendVelocityScore: mockSocialTrend.trendVelocityScore
    }
  });

  await Promise.all(
    mockNews.map((article) =>
      prisma.newsArticle.upsert({
        where: { url: article.url },
        create: {
          ...article,
          publishedAt: new Date(article.publishedAt),
          analyzedAt: article.analyzedAt ? new Date(article.analyzedAt) : null
        },
        update: {}
      })
    )
  );

  await prisma.predictionSnapshot.create({
    data: {
      bullishProbability: mockPrediction.bullishProbability,
      bearishProbability: mockPrediction.bearishProbability,
      sidewaysProbability: mockPrediction.sidewaysProbability,
      confidence: mockPrediction.confidence,
      signal: mockPrediction.signal,
      riskLevel: mockPrediction.riskLevel,
      riskScore: mockPrediction.riskScore,
      reasonsJson: mockPrediction.reasons,
      marketScore: mockPrediction.marketScore,
      socialScore: mockPrediction.socialScore,
      newsScore: mockPrediction.newsScore,
      liquidityScore: mockPrediction.liquidityScore,
      whaleScore: mockPrediction.whaleScore
    }
  });

  await Promise.all(mockAlerts.map((alert) => prisma.alert.create({ data: alert })));
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
