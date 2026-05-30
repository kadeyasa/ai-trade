import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { CoinGeckoDataPanel } from "@/components/dashboard/CoinGeckoDataPanel";
import { ComprehensiveAnalysisPanel } from "@/components/dashboard/ComprehensiveAnalysisPanel";
import { DataSourcesPanel } from "@/components/dashboard/DataSourcesPanel";
import { EntryInsightPanel } from "@/components/dashboard/EntryInsightPanel";
import { HypeMarketInsights } from "@/components/dashboard/HypeMarketInsights";
import { IndicatorControls, type SignalIndicator } from "@/components/dashboard/IndicatorControls";
import { MarketOverview } from "@/components/dashboard/MarketOverview";
import { NewsImpactPanel } from "@/components/dashboard/NewsImpactPanel";
import { PredictionSignal } from "@/components/dashboard/PredictionSignal";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { RiskScoreCard } from "@/components/dashboard/RiskScoreCard";
import { SocialTrendCard } from "@/components/dashboard/SocialTrendCard";
import { TokenHealthPanel } from "@/components/dashboard/TokenHealthPanel";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardHeader } from "@/components/ui/Card";
import { scoringWeights } from "@/config/scoring";
import { tokenConfig as defaultTokenConfig } from "@/config/token";
import { getAdminSettings, getOpenAIKey, getXBearerToken } from "@/lib/admin-settings";
import { createEntryInsight } from "@/lib/entry-insight";
import { hasSecret } from "@/lib/env";
import { mockAlerts } from "@/lib/mock-data";
import { createPrediction } from "@/lib/scoring";
import { createComprehensiveAnalysis } from "@/services/ai/comprehensive";
import { getHypeMarketInsight } from "@/services/insights/hype.service";
import { getCoinAnalysisMarket, getCoinAnalysisSeries, getCryptoAssetById } from "@/services/market/market.service";
import { getNewsForToken } from "@/services/news/news.service";
import { getSocialForToken } from "@/services/social/social.service";
import type { AnalysisSource } from "@/types/analysis";
import type { TokenConfigView } from "@/types/token";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams?: { coinId?: string } }) {
  const coinId = searchParams?.coinId;

  const selectedAsset = coinId ? await getCryptoAssetById(coinId) : null;

  const selectedToken: TokenConfigView = selectedAsset
    ? {
        ...defaultTokenConfig,
        id: selectedAsset.id,
        name: selectedAsset.name,
        symbol: selectedAsset.symbol,
        totalSupply: selectedAsset.fdv && selectedAsset.currentPriceUsd > 0 ? selectedAsset.fdv / selectedAsset.currentPriceUsd : defaultTokenConfig.totalSupply
      }
    : defaultTokenConfig;

  if (!selectedAsset) {
    const hypeInsight = await getHypeMarketInsight();

    return (
      <PageContainer token={selectedToken}>
        <div className="space-y-6">
          <HypeMarketInsights insight={hypeInsight} />
          <Card>
            <CardHeader title="Mulai Detail Analisa" />
            <p className="text-sm leading-6 text-slate-600">
              Pilih salah satu coin dari watchlist atau menu List Coin untuk membuka detail analisa khusus coin tersebut.
              Panel harga, prediction, risk, chart, indikator, news, dan sentiment hanya tampil setelah coin dipilih.
            </p>
          </Card>
        </div>
      </PageContainer>
    );
  }

  const [market, series, socialBundle, articles, defaultPrediction] = await Promise.all([
    getCoinAnalysisMarket(selectedAsset.id),
    getCoinAnalysisSeries(selectedAsset.id),
    getSocialForToken(selectedToken),
    getNewsForToken(selectedToken),
    Promise.resolve(null)
  ]);

  const prediction =
    defaultPrediction ?? createPrediction({ market, social: socialBundle.trend, news: articles });
  const settings = getAdminSettings();
  const openaiReady = hasSecret(getOpenAIKey());
  const xReady = hasSecret(getXBearerToken());
  const sources: AnalysisSource[] = [
    {
      name: "Market Snapshot",
      provider: selectedAsset ? "CoinGecko Markets API" : "Database / Data cadangan",
      status: selectedAsset ? "REAL" : "FALLBACK",
      analyzedCount: 1,
      note: selectedAsset ? "Harga, market cap, FDV, volume 24h, dan perubahan harga." : "Mode default token memakai data tersimpan atau data cadangan."
    },
    {
      name: "Price Chart",
      provider: selectedAsset ? "CoinGecko Market Chart API" : "Database / Data cadangan",
      status: selectedAsset ? "REAL" : "FALLBACK",
      analyzedCount: series.length,
      note: "Titik chart 24 jam dipakai untuk membaca arah market."
    },
    {
      name: "Tweet / Social",
      provider: xReady ? "X API + AI sentiment" : "Data sosial cadangan + AI/heuristic sentiment",
      status: xReady ? "REAL" : "FALLBACK",
      analyzedCount: socialBundle.posts.length,
      note: openaiReady
        ? `OpenAI dipakai untuk sentiment, spam score, dan topic. Limit admin: ${settings.socialAnalysisLimit} post.`
        : `OpenAI key belum ada, memakai heuristic sentiment. Limit admin: ${settings.socialAnalysisLimit} post.`
    },
    {
      name: "News",
      provider: "GDELT DOC API + AI news impact",
      status: articles.some((article) => article.source.includes("Mock") || article.source.includes("Fallback") || article.source.includes("Cadangan")) ? "FALLBACK" : "REAL",
      analyzedCount: articles.length,
      note: openaiReady
        ? `OpenAI dipakai untuk relevance, impact, category, dan summary. Limit admin: ${settings.newsAnalysisLimit} artikel.`
        : `OpenAI key belum ada, memakai heuristic news impact. Limit admin: ${settings.newsAnalysisLimit} artikel.`
    },
    {
      name: "AI Comprehensive",
      provider: openaiReady ? "OpenAI" : "Local heuristic",
      status: openaiReady ? "REAL" : "FALLBACK",
      analyzedCount: 1,
      note: "Menggabungkan market, tweet, news, prediction score, dan risk warning."
    }
  ];
  const comprehensiveAnalysis = await createComprehensiveAnalysis({
    token: selectedToken,
    market,
    socialTrend: socialBundle.trend,
    posts: socialBundle.posts,
    news: articles,
    prediction,
    sources
  });
  const entryInsight = createEntryInsight(market, series);
  const indicators: SignalIndicator[] = [
    {
      key: "market",
      label: "Market Momentum",
      weight: scoringWeights.marketMomentum,
      score: prediction.marketScore,
      description: "Mengukur kekuatan arah pasar dari perubahan harga, volume, dan rasio buy/sell.",
      subIndicators: ["price change 1h", "price change 6h", "price change 24h", "volume/liquidity", "buy/sell ratio"]
    },
    {
      key: "social",
      label: "Social Sentiment",
      weight: scoringWeights.socialSentiment,
      score: prediction.socialScore,
      description: "Mengukur sentimen percakapan sosial setelah spam dan pola berulang diberi penalti.",
      subIndicators: ["positive vs negative", "mention growth", "engagement", "spam penalty", "topic trend"]
    },
    {
      key: "news",
      label: "News Impact",
      weight: scoringWeights.newsImpact,
      score: prediction.newsScore,
      description: "Mengukur dampak berita berdasarkan relevansi, arah impact, dan kategori risiko.",
      subIndicators: ["relevance score", "impact score", "urgency", "category", "negative pressure"]
    },
    {
      key: "liquidity",
      label: "Liquidity Health",
      weight: scoringWeights.liquidityHealth,
      score: prediction.liquidityScore,
      description: "Mengukur kedalaman liquidity, rasio volume terhadap liquidity, dan risiko slippage.",
      subIndicators: ["liquidity size", "volume/liquidity ratio", "FDV support", "slippage proxy", "depth"]
    },
    {
      key: "risk",
      label: "Risk Adjustment",
      weight: scoringWeights.riskAdjustment,
      score: 1 - prediction.riskScore,
      description: "Menyesuaikan sinyal berdasarkan spam surge, news negatif, liquidity stress, dan sell pressure.",
      subIndicators: ["spam surge", "negative news", "liquidity stress", "sell pressure", "suspicious pattern"]
    }
  ];

  return (
    <PageContainer token={selectedToken}>
      <div className="space-y-6">
        <CoinGeckoDataPanel asset={selectedAsset} />
        <EntryInsightPanel insight={entryInsight} />
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <PredictionSignal prediction={prediction} />
          <RiskScoreCard prediction={prediction} />
        </div>
        <MarketOverview market={market} />
        <PriceChart series={series} />
        <IndicatorControls indicators={indicators} prediction={prediction} />
        <ComprehensiveAnalysisPanel analysis={comprehensiveAnalysis} />
        <DataSourcesPanel sources={sources} />
        <div className="grid gap-6 xl:grid-cols-2">
          <SocialTrendCard trend={socialBundle.trend} posts={socialBundle.posts} />
          <NewsImpactPanel articles={articles} />
        </div>
        <div className="grid gap-6 xl:grid-cols-1">
          <TokenHealthPanel token={selectedToken} />
        </div>
        <AlertsPanel alerts={mockAlerts} />
      </div>
    </PageContainer>
  );
}
