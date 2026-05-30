import type { AnalysisSource, ComprehensiveAnalysis } from "@/types/analysis";
import type { MarketSnapshotView } from "@/types/market";
import type { NewsArticleView } from "@/types/news";
import type { PredictionSnapshotView } from "@/types/prediction";
import type { SocialPostView, SocialTrendView } from "@/types/social";
import type { TokenConfigView } from "@/types/token";
import { getOpenAIClient } from "@/services/ai/openai";

type ComprehensiveInput = {
  token: TokenConfigView;
  market: MarketSnapshotView;
  socialTrend: SocialTrendView;
  posts: SocialPostView[];
  news: NewsArticleView[];
  prediction: PredictionSnapshotView;
  sources: AnalysisSource[];
};

function fallbackAnalysis(input: ComprehensiveInput): ComprehensiveAnalysis {
  const positiveNews = input.news.filter((article) => article.impact === "positive").length;
  const negativeNews = input.news.filter((article) => article.impact === "negative").length;
  const positivePosts = input.posts.filter((post) => post.sentiment === "positive").length;
  const negativePosts = input.posts.filter((post) => post.sentiment === "negative").length;
  const neutralPosts = input.posts.filter((post) => post.sentiment === "neutral" || !post.sentiment).length;
  const totalPosts = Math.max(1, input.posts.length);
  const totalNews = Math.max(1, input.news.length);
  const positivePostRate = positivePosts / totalPosts;
  const negativePostRate = negativePosts / totalPosts;
  const positiveNewsRate = positiveNews / totalNews;
  const negativeNewsRate = negativeNews / totalNews;
  const volumeToMarketCap = input.market.marketCap ? input.market.volume24h / Math.max(1, input.market.marketCap) : 0;
  const categoryCounts = input.news.reduce<Record<string, number>>((acc, article) => {
    const category = article.category ?? "market";
    acc[category] = (acc[category] ?? 0) + 1;
    return acc;
  }, {});
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category]) => category)
    .join(", ");
  const sentimentBias =
    positivePostRate > negativePostRate + 0.1
      ? "positif"
      : negativePostRate > positivePostRate + 0.1
        ? "negatif"
        : "campuran";
  const newsBias =
    positiveNewsRate > negativeNewsRate + 0.08
      ? "positif"
      : negativeNewsRate > positiveNewsRate + 0.08
        ? "negatif"
        : "netral/campuran";
  const momentumLabel =
    input.market.priceChange24h > 5
      ? "kuat"
      : input.market.priceChange24h > 0
        ? "positif ringan"
        : input.market.priceChange24h < -5
          ? "tertekan"
          : "lemah/campuran";
  const liquidityLabel =
    volumeToMarketCap > 0.18
      ? "sangat aktif"
      : volumeToMarketCap > 0.06
        ? "aktif"
        : "sedang";

  return {
    method: "HEURISTIC",
    summary: `${input.token.name} dianalisa dalam mode heuristic dari market CoinGecko, ${input.posts.length} tweet/post, dan ${input.news.length} artikel news. Momentum 24h terukur ${momentumLabel} (${input.market.priceChange24h.toFixed(2)}%), aktivitas volume ${liquidityLabel} (${(volumeToMarketCap * 100).toFixed(2)}% dari market cap), sentiment sosial ${sentimentBias}, dan bias news ${newsBias}. Sinyal saat ini ${input.prediction.signal} dengan confidence ${Math.round(input.prediction.confidence * 100)}% dan risk score ${Math.round(input.prediction.riskScore * 100)}%.`,
    opportunities: [
      input.market.priceChange24h >= 0
        ? `${input.token.symbol} masih mencatat momentum 24h positif ${input.market.priceChange24h.toFixed(2)}%.`
        : `${input.token.symbol} sedang melemah ${Math.abs(input.market.priceChange24h).toFixed(2)}%, peluang lebih konservatif menunggu reclaim harga.`,
      `Volume 24h ${input.market.volume24h.toLocaleString("en-US", { maximumFractionDigits: 0 })} memberi likuiditas observasi; rasio volume/market cap ${(volumeToMarketCap * 100).toFixed(2)}%.`,
      `Sentiment sosial ${sentimentBias}: ${positivePosts} positif, ${negativePosts} negatif, ${neutralPosts} netral dari ${input.posts.length} post.`,
      `News bias ${newsBias}; kategori dominan yang muncul: ${topCategories || "market"}.`,
      input.prediction.confidence > 0.6
        ? `Confidence ${Math.round(input.prediction.confidence * 100)}% cukup terbaca untuk observasi skenario.`
        : `Confidence ${Math.round(input.prediction.confidence * 100)}% masih sedang, perlu konfirmasi candle dan volume.`
    ],
    risks: [
      input.prediction.riskLevel === "LOW"
        ? `Risk level ${input.prediction.riskLevel}, tetapi invalidation tetap perlu dipatuhi.`
        : `Risk level ${input.prediction.riskLevel}; setup perlu ukuran posisi dan invalidation lebih ketat.`,
      input.socialTrend.spamCount > 0
        ? `${input.socialTrend.spamCount} post terindikasi spam/pola berulang sehingga sentiment bisa bias.`
        : "Spam sosial rendah pada dataset yang dianalisa.",
      volumeToMarketCap > 0.2
        ? `Volume relatif tinggi (${(volumeToMarketCap * 100).toFixed(2)}% market cap), potensi whipsaw meningkat.`
        : `Rasio volume/market cap ${(volumeToMarketCap * 100).toFixed(2)}% masih lebih terkendali.`,
      negativeNews > positiveNews
        ? `${negativeNews} artikel berdampak negatif melebihi ${positiveNews} artikel positif.`
        : `News negatif belum dominan: ${negativeNews} negatif vs ${positiveNews} positif.`,
      negativePosts > positivePosts
        ? `Percakapan sosial negatif (${negativePosts}) lebih banyak dari positif (${positivePosts}).`
        : `Tekanan sosial negatif belum dominan: ${negativePosts} negatif vs ${positivePosts} positif.`
    ],
    nextWatchItems: [
      `Konfirmasi apakah ${input.token.symbol} mampu bertahan di atas area support intraday dan membentuk higher low.`,
      `Perhatikan lonjakan volume: saat ini rasio volume/market cap ${(volumeToMarketCap * 100).toFixed(2)}%.`,
      `Pantau perubahan sentiment sosial dari bias ${sentimentBias}, terutama jika post negatif naik cepat.`,
      `Pantau headline kategori ${topCategories || "market"}, terutama listing, regulation, exploit, unlock, partnership, liquidity.`,
      `Cek ulang confidence ${Math.round(input.prediction.confidence * 100)}% dan risk score ${Math.round(input.prediction.riskScore * 100)}% setelah data terbaru masuk.`
    ]
  };
}

export async function createComprehensiveAnalysis(input: ComprehensiveInput): Promise<ComprehensiveAnalysis> {
  const client = getOpenAIClient();
  if (!client) return fallbackAnalysis(input);

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a crypto intelligence analyst. Do not provide financial advice. Analyze market, tweets, and news probabilistically. Return JSON only with {summary, opportunities, risks, nextWatchItems}. Each array must contain 5 concise Indonesian items."
        },
        {
          role: "user",
          content: JSON.stringify({
            token: input.token,
            market: input.market,
            prediction: input.prediction,
            socialTrend: input.socialTrend,
            tweets: input.posts.slice(0, 50).map((post) => ({
              text: post.text,
              sentiment: post.sentiment,
              sentimentScore: post.sentimentScore,
              spamScore: post.spamScore,
              engagement: post.likeCount + post.repostCount + post.replyCount + post.quoteCount
            })),
            news: input.news.slice(0, 50).map((article) => ({
              title: article.title,
              summary: article.summary,
              relevanceScore: article.relevanceScore,
              impact: article.impact,
              impactScore: article.impactScore,
              category: article.category
            })),
            sources: input.sources
          })
        }
      ]
    });
    const parsed = JSON.parse(response.choices[0]?.message.content ?? "{}") as Partial<ComprehensiveAnalysis>;
    return {
      method: "OPENAI",
      summary: parsed.summary ?? fallbackAnalysis(input).summary,
      opportunities: parsed.opportunities?.slice(0, 5) ?? fallbackAnalysis(input).opportunities,
      risks: parsed.risks?.slice(0, 5) ?? fallbackAnalysis(input).risks,
      nextWatchItems: parsed.nextWatchItems?.slice(0, 5) ?? fallbackAnalysis(input).nextWatchItems
    };
  } catch {
    return fallbackAnalysis(input);
  }
}
