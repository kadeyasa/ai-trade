import { tokenConfig } from "@/config/token";
import { getAdminSettings } from "@/lib/admin-settings";
import { isMockMode } from "@/lib/env";
import { mockSocialPosts, mockSocialTrend } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import type { SocialPostView, SocialTrendView } from "@/types/social";
import { fetchXPosts } from "@/services/social/x-api";
import { analyzeSocialPosts } from "@/services/ai/sentiment";

export async function getSocialPosts(): Promise<SocialPostView[]> {
  if (isMockMode()) return mockSocialPosts;
  const rows = await prisma.socialPost.findMany({ orderBy: { createdAt: "desc" }, take: 25 });
  return rows.map((row) => ({
    id: row.id,
    source: row.source as "x" | "mock",
    externalId: row.externalId,
    authorUsername: row.authorUsername,
    text: row.text,
    url: row.url,
    likeCount: row.likeCount,
    repostCount: row.repostCount,
    replyCount: row.replyCount,
    quoteCount: row.quoteCount,
    viewCount: row.viewCount,
    sentiment: row.sentiment as SocialPostView["sentiment"],
    sentimentScore: row.sentimentScore == null ? undefined : Number(row.sentimentScore),
    spamScore: row.spamScore == null ? undefined : Number(row.spamScore),
    topic: row.topic ?? undefined,
    createdAt: row.createdAt.toISOString(),
    analyzedAt: row.analyzedAt?.toISOString()
  }));
}

export async function getSocialTrend(): Promise<SocialTrendView> {
  if (isMockMode()) return mockSocialTrend;
  const latest = await prisma.socialTrendSnapshot.findFirst({ orderBy: { createdAt: "desc" } });
  if (!latest) return mockSocialTrend;
  return {
    keyword: latest.keyword,
    totalMentions: latest.totalMentions,
    positiveCount: latest.positiveCount,
    negativeCount: latest.negativeCount,
    neutralCount: latest.neutralCount,
    spamCount: latest.spamCount,
    topTopics: Array.isArray(latest.topTopicsJson) ? (latest.topTopicsJson as string[]) : [],
    trendVelocityScore: Number(latest.trendVelocityScore),
    createdAt: latest.createdAt.toISOString()
  };
}

export async function getSocialForToken(token: { name: string; symbol: string; contractAddress?: string }) {
  const limit = getAdminSettings().socialAnalysisLimit;
  const queries = [token.symbol, token.name, token.contractAddress ?? ""].filter(Boolean);
  const posts = (await fetchXPosts(queries, limit).catch(() => null)) ?? createFallbackSocialPosts(token, limit);
  const analyzed = await analyzeSocialPosts(posts);
  const totalMentions = Math.max(analyzed.length, analyzed.reduce((sum, post) => sum + Math.ceil((post.viewCount || 0) / 1000), 0));
  const positiveCount = analyzed.filter((post) => post.sentiment === "positive").length;
  const negativeCount = analyzed.filter((post) => post.sentiment === "negative").length;
  const neutralCount = analyzed.length - positiveCount - negativeCount;
  const spamCount = analyzed.filter((post) => (post.spamScore ?? 0) > 0.5).length;
  const topTopics = Array.from(new Set(analyzed.map((post) => post.topic).filter(Boolean))) as string[];

  return {
    posts: analyzed,
    trend: {
      keyword: token.symbol.toUpperCase(),
      totalMentions,
      positiveCount,
      negativeCount,
      neutralCount,
      spamCount,
      topTopics: topTopics.length ? topTopics : ["market", "liquidity", "sentiment"],
      trendVelocityScore: Math.min(1, totalMentions / 50),
      createdAt: new Date().toISOString()
    } satisfies SocialTrendView
  };
}

function createFallbackSocialPosts(token: { name: string; symbol: string }, limit: number) {
  const templates = [
    `${token.symbol} volume mulai ramai, perlu lihat apakah buyer masih konsisten.`,
    `${token.name} price action menarik tapi risk management tetap penting.`,
    `Komunitas ${token.symbol} membahas liquidity, listing, dan update ecosystem.`,
    `Ada diskusi soal sell pressure jangka pendek pada ${token.symbol}.`,
    `${token.name} masih dipantau karena market cap dan volume bergerak aktif.`,
    `Sentimen ${token.symbol} terlihat campuran antara optimis dan wait-and-see.`,
    `Beberapa trader menunggu konfirmasi breakout ${token.symbol}.`,
    `News dan social trend ${token.name} perlu dicek bareng data market.`,
    `${token.symbol} mendapat perhatian karena perubahan volume 24 jam.`,
    `Investor membandingkan ${token.name} dengan coin sejenis di market.`
  ];

  return Array.from({ length: limit }, (_, index) => {
    const base = mockSocialPosts[index % mockSocialPosts.length];
    return {
      ...base,
      externalId: `fallback-${token.symbol.toLowerCase()}-${index + 1}`,
      authorUsername: `marketwatch${index + 1}`,
      text: templates[index % templates.length],
      url: `https://example.com/social/${token.symbol.toLowerCase()}-${index + 1}`,
      likeCount: base.likeCount + index * 3,
      repostCount: base.repostCount + index,
      replyCount: base.replyCount + (index % 7),
      quoteCount: base.quoteCount + (index % 3),
      viewCount: base.viewCount + index * 900,
      createdAt: new Date(Date.now() - (index + 1) * 18 * 60 * 1000).toISOString()
    } satisfies SocialPostView;
  });
}

export function getLightweightSocialForToken(token: { name: string; symbol: string }) {
  const createdAt = new Date().toISOString();
  const posts: SocialPostView[] = [
    {
      source: "mock",
      externalId: `light-social-${token.symbol.toLowerCase()}`,
      authorUsername: "coingecko-market",
      text: `${token.name} dashboard menggunakan mode ringan. Hubungkan X API untuk percakapan sosial real-time.`,
      url: "https://www.coingecko.com/",
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      quoteCount: 0,
      viewCount: 0,
      sentiment: "neutral",
      sentimentScore: 0,
      spamScore: 0,
      topic: "market",
      createdAt,
      analyzedAt: createdAt
    }
  ];

  return {
    posts,
    trend: {
      keyword: token.symbol.toUpperCase(),
      totalMentions: 0,
      positiveCount: 0,
      negativeCount: 0,
      neutralCount: 1,
      spamCount: 0,
      topTopics: ["market", "coingecko"],
      trendVelocityScore: 0,
      createdAt
    } satisfies SocialTrendView
  };
}

export async function collectSocialPosts() {
  if (isMockMode()) return mockSocialPosts;
  const posts =
    (await fetchXPosts([tokenConfig.symbol, tokenConfig.name, tokenConfig.contractAddress]).catch(() => null)) ??
    mockSocialPosts;
  const analyzed = await analyzeSocialPosts(posts);

  await Promise.all(
    analyzed.map((post) =>
      prisma.socialPost.upsert({
        where: { externalId: post.externalId },
        create: {
          ...post,
          createdAt: new Date(post.createdAt),
          analyzedAt: post.analyzedAt ? new Date(post.analyzedAt) : null
        },
        update: {
          ...post,
          createdAt: new Date(post.createdAt),
          analyzedAt: post.analyzedAt ? new Date(post.analyzedAt) : null
        }
      })
    )
  );

  const totalMentions = analyzed.length;
  const positiveCount = analyzed.filter((post) => post.sentiment === "positive").length;
  const negativeCount = analyzed.filter((post) => post.sentiment === "negative").length;
  const neutralCount = analyzed.filter((post) => post.sentiment === "neutral" || !post.sentiment).length;
  const spamCount = analyzed.filter((post) => (post.spamScore ?? 0) > 0.5).length;
  const topics = Array.from(new Set(analyzed.map((post) => post.topic).filter(Boolean))) as string[];

  await prisma.socialTrendSnapshot.create({
    data: {
      keyword: tokenConfig.symbol,
      totalMentions,
      positiveCount,
      negativeCount,
      neutralCount,
      spamCount,
      topTopicsJson: topics,
      trendVelocityScore: Math.min(1, totalMentions / 50)
    }
  });

  return analyzed;
}
