import type { CryptoAsset, MarketSeriesPoint, MarketSnapshotView } from "@/types/market";
import type { NewsArticleView } from "@/types/news";
import type { AlertView, PredictionSnapshotView } from "@/types/prediction";
import type { SocialPostView, SocialTrendView } from "@/types/social";

const now = new Date();

export const mockMarket: MarketSnapshotView = {
  priceUsd: 0.0684,
  priceIdr: 1102,
  liquidityUsd: 428000,
  volume24h: 87400,
  marketCap: 6840000,
  fdv: 6840000,
  txnsBuy24h: 342,
  txnsSell24h: 287,
  priceChange1h: 1.8,
  priceChange6h: 4.6,
  priceChange24h: 8.9,
  createdAt: now.toISOString()
};

export const mockCryptoAssets: CryptoAsset[] = [
  {
    id: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
    currentPriceUsd: 104250,
    marketCap: 2070000000000,
    marketCapRank: 1,
    fdv: 2189000000000,
    volume24h: 38400000000,
    priceChange1h: 0.3,
    priceChange24h: 1.9,
    priceChange7d: 7.4,
    sparkline7d: [98200, 99100, 100400, 99700, 101800, 103200, 104250]
  },
  {
    id: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
    currentPriceUsd: 3860,
    marketCap: 465000000000,
    marketCapRank: 2,
    fdv: 465000000000,
    volume24h: 21200000000,
    priceChange1h: -0.2,
    priceChange24h: -0.8,
    priceChange7d: 3.2,
    sparkline7d: [3710, 3785, 3820, 3915, 3880, 3840, 3860]
  },
  {
    id: "binancecoin",
    symbol: "BNB",
    name: "BNB",
    currentPriceUsd: 672,
    marketCap: 98000000000,
    marketCapRank: 4,
    fdv: 98000000000,
    volume24h: 1450000000,
    priceChange1h: 0.1,
    priceChange24h: 0.7,
    priceChange7d: 2.8,
    sparkline7d: [650, 656, 660, 668, 664, 670, 672]
  }
];

export const mockMarketSeries: MarketSeriesPoint[] = Array.from({ length: 24 }, (_, index) => {
  const hour = 23 - index;
  const wave = Math.sin(index / 3) * 0.003;
  return {
    time: new Date(now.getTime() - hour * 60 * 60 * 1000).toISOString(),
    priceUsd: 0.061 + index * 0.00032 + wave,
    liquidityUsd: 402000 + index * 1200 + Math.cos(index / 2) * 7000,
    volume24h: 76000 + index * 520 + Math.sin(index / 2) * 3500
  };
});

export const mockSocialPosts: SocialPostView[] = [
  {
    source: "mock",
    externalId: "mock-1",
    authorUsername: "chainwatcher",
    text: "Market staking claims are picking up and burn updates look transparent so far.",
    url: "https://example.com/social/mock-1",
    likeCount: 182,
    repostCount: 38,
    replyCount: 24,
    quoteCount: 7,
    viewCount: 12800,
    sentiment: "positive",
    sentimentScore: 0.74,
    spamScore: 0.08,
    topic: "staking",
    createdAt: new Date(now.getTime() - 48 * 60 * 1000).toISOString(),
    analyzedAt: now.toISOString()
  },
  {
    source: "mock",
    externalId: "mock-2",
    authorUsername: "dexriskdesk",
    text: "Liquidity depth improved but sell pressure is still worth watching during reward claims.",
    url: "https://example.com/social/mock-2",
    likeCount: 96,
    repostCount: 19,
    replyCount: 18,
    quoteCount: 5,
    viewCount: 9400,
    sentiment: "neutral",
    sentimentScore: 0.08,
    spamScore: 0.05,
    topic: "liquidity",
    createdAt: new Date(now.getTime() - 96 * 60 * 1000).toISOString(),
    analyzedAt: now.toISOString()
  },
  {
    source: "mock",
    externalId: "mock-3",
    authorUsername: "rankbuilder",
    text: "Affiliate rank chatter is surging, but a few repeated posts look coordinated.",
    url: "https://example.com/social/mock-3",
    likeCount: 54,
    repostCount: 28,
    replyCount: 9,
    quoteCount: 3,
    viewCount: 6100,
    sentiment: "negative",
    sentimentScore: -0.32,
    spamScore: 0.42,
    topic: "affiliate",
    createdAt: new Date(now.getTime() - 150 * 60 * 1000).toISOString(),
    analyzedAt: now.toISOString()
  }
];

export const mockSocialTrend: SocialTrendView = {
  keyword: "MARKET",
  totalMentions: 1260,
  positiveCount: 681,
  negativeCount: 218,
  neutralCount: 361,
  spamCount: 92,
  topTopics: ["staking", "burn", "affiliate ranks", "liquidity"],
  trendVelocityScore: 0.68,
  createdAt: now.toISOString()
};

export const mockNews: NewsArticleView[] = [
  {
    source: "GDELT Cadangan",
    title: "DEX tokens face renewed scrutiny as liquidity incentives grow",
    url: "https://example.com/news/dex-liquidity",
    publishedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
    summary: "Regulatory and liquidity risks are being discussed across smaller exchange-traded tokens.",
    relevanceScore: 0.72,
    impact: "negative",
    impactScore: -0.36,
    category: "regulation",
    analyzedAt: now.toISOString()
  },
  {
    source: "GDELT Cadangan",
    title: "Project teams highlight burn mechanics to offset reward emissions",
    url: "https://example.com/news/burn-mechanics",
    publishedAt: new Date(now.getTime() - 11 * 60 * 60 * 1000).toISOString(),
    summary: "Token burn narratives remain constructive when liquidity and emissions are transparent.",
    relevanceScore: 0.84,
    impact: "positive",
    impactScore: 0.48,
    category: "tokenomics",
    analyzedAt: now.toISOString()
  }
];

export const mockAlerts: AlertView[] = [
  {
    type: "LIQUIDITY",
    severity: "MEDIUM",
    title: "Liquidity concentration watch",
    message: "Volume-to-liquidity ratio is elevated. Slippage risk may increase during claim windows.",
    isRead: false,
    createdAt: now.toISOString()
  },
  {
    type: "SOCIAL",
    severity: "LOW",
    title: "Spam pattern detected",
    message: "Repeated affiliate-rank posts increased, but current spam score is below critical thresholds.",
    isRead: false,
    createdAt: now.toISOString()
  }
];

export const mockPrediction: PredictionSnapshotView = {
  bullishProbability: 0.56,
  bearishProbability: 0.24,
  sidewaysProbability: 0.2,
  confidence: 0.64,
  signal: "BULLISH",
  riskLevel: "MEDIUM",
  riskScore: 0.43,
  reasons: [
    "24h momentum is positive with more buys than sells.",
    "Social sentiment is net positive after spam filtering.",
    "Liquidity is adequate, though claim-cycle sell pressure remains a watch item."
  ],
  marketScore: 0.69,
  socialScore: 0.61,
  newsScore: 0.54,
  liquidityScore: 0.58,
  whaleScore: 0.44,
  createdAt: now.toISOString()
};
