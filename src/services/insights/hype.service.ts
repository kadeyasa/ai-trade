import { getCryptoAssets } from "@/services/market/market.service";
import type { HypeCoinInsight, HypeMarketInsight } from "@/types/insight";
import type { CryptoAsset } from "@/types/market";

const excludedSymbols = new Set([
  "USDT",
  "USDC",
  "DAI",
  "FDUSD",
  "TUSD",
  "USDE",
  "USDS",
  "BUSD",
  "WBTC",
  "WETH",
  "STETH",
  "WSTETH",
  "WEETH"
]);

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function scoreChange(change = 0, bullishCap = 12, bearishCap = -8) {
  if (change >= 0) return clamp(0.5 + change / bullishCap / 2);
  return clamp(0.5 + change / Math.abs(bearishCap) / 2);
}

function calculateRsiProxy(prices: number[] = []) {
  if (prices.length < 4) return 50;
  const recent = prices.slice(-24);
  let gains = 0;
  let losses = 0;
  for (let index = 1; index < recent.length; index += 1) {
    const diff = recent[index] - recent[index - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }
  if (losses === 0) return 72;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

function calculateVolatility(prices: number[] = []) {
  if (prices.length < 4) return 0;
  const recent = prices.slice(-24);
  const avg = recent.reduce((sum, price) => sum + price, 0) / recent.length;
  const variance = recent.reduce((sum, price) => sum + Math.pow((price - avg) / Math.max(1, avg), 2), 0) / recent.length;
  return Math.sqrt(variance);
}

function buildInsight(asset: CryptoAsset): HypeCoinInsight {
  const volumeToMarketCap = asset.marketCap ? asset.volume24h / Math.max(1, asset.marketCap) : 0;
  const rsiProxy = calculateRsiProxy(asset.sparkline7d);
  const volatility = calculateVolatility(asset.sparkline7d);
  const rankBoost = asset.marketCapRank ? clamp((260 - asset.marketCapRank) / 260) : 0.35;
  const momentumScore =
    scoreChange(asset.priceChange1h ?? 0, 5, -4) * 0.25 +
    scoreChange(asset.priceChange24h, 14, -10) * 0.45 +
    scoreChange(asset.priceChange7d ?? asset.priceChange24h, 35, -20) * 0.3;
  const volumeScore = clamp(volumeToMarketCap / 0.22);
  const rsiScore = rsiProxy >= 45 && rsiProxy <= 72 ? 0.82 : rsiProxy > 78 ? 0.48 : 0.55;
  const volatilityPenalty = clamp(volatility / 0.08);
  const technicalScore = clamp(momentumScore * 0.45 + volumeScore * 0.25 + rsiScore * 0.2 + rankBoost * 0.1 - volatilityPenalty * 0.08);

  const sentimentScore = clamp(
    0.42 +
      scoreChange(asset.priceChange24h, 12, -10) * 0.24 +
      volumeScore * 0.22 +
      rankBoost * 0.12 -
      volatilityPenalty * 0.06
  );
  const newsCatalystScore = clamp(
    0.38 +
      rankBoost * 0.18 +
      volumeScore * 0.24 +
      scoreChange(asset.priceChange7d ?? 0, 30, -18) * 0.2
  );
  const riskScore = clamp(
    (asset.priceChange24h > 18 ? 0.22 : 0) +
      (asset.priceChange24h < -8 ? 0.24 : 0) +
      volatilityPenalty * 0.35 +
      (volumeToMarketCap > 0.45 ? 0.18 : 0) +
      (rsiProxy > 82 ? 0.18 : 0)
  );
  const hypeScore = clamp(technicalScore * 0.38 + sentimentScore * 0.25 + newsCatalystScore * 0.22 + volumeScore * 0.15);
  const longSetupScore = clamp(hypeScore * 0.72 + (1 - riskScore) * 0.28);
  const signal =
    riskScore > 0.68 ? "HIGH_RISK" : longSetupScore > 0.72 ? "STRONG_WATCH" : longSetupScore > 0.6 ? "WATCH" : "NEUTRAL";

  return {
    id: asset.id,
    symbol: asset.symbol,
    name: asset.name,
    image: asset.image,
    rank: asset.marketCapRank,
    priceUsd: asset.currentPriceUsd,
    marketCap: asset.marketCap,
    volume24h: asset.volume24h,
    priceChange1h: asset.priceChange1h,
    priceChange24h: asset.priceChange24h,
    priceChange7d: asset.priceChange7d,
    hypeScore,
    longSetupScore,
    technicalScore,
    sentimentScore,
    newsCatalystScore,
    riskScore,
    signal,
    technicalReasons: [
      `Momentum 24h ${asset.priceChange24h.toFixed(2)}% dan 7d ${(asset.priceChange7d ?? 0).toFixed(2)}%.`,
      `Volume/market cap ${(volumeToMarketCap * 100).toFixed(2)}% sebagai proxy aktivitas.`,
      `RSI proxy ${Math.round(rsiProxy)} dari sparkline 7 hari.`
    ],
    sentimentReasons: [
      "Sentiment proxy dihitung dari momentum harga, volume relatif, dan rank market.",
      asset.priceChange24h >= 0 ? "Price action positif mendukung persepsi market." : "Price action negatif menekan persepsi market.",
      volumeScore > 0.5 ? "Aktivitas volume relatif tinggi." : "Aktivitas volume relatif belum terlalu dominan."
    ],
    newsReasons: [
      "News catalyst proxy memakai rank, volume, dan momentum 7 hari karena scan news per coin massal dibatasi agar load ringan.",
      rankBoost > 0.6 ? "Market rank tinggi membuat coin lebih sensitif terhadap headline market luas." : "Market rank sedang/rendah, validasi news perlu manual.",
      "Pantau headline listing, ETF/regulasi, exploit, partnership, unlock, staking, dan burn."
    ],
    riskReasons: [
      riskScore > 0.5 ? "Risk tinggi karena volatilitas/momentum terlalu panas." : "Risk model tidak menunjukkan tekanan ekstrem.",
      rsiProxy > 78 ? "RSI proxy mulai overbought." : "RSI proxy belum ekstrem.",
      volumeToMarketCap > 0.45 ? "Volume relatif sangat tinggi, rawan whipsaw." : "Volume relatif masih lebih terkendali."
    ]
  };
}

export async function getHypeMarketInsight(): Promise<HypeMarketInsight> {
  const { assets, isFallback } = await getCryptoAssets();
  const candidates = assets
    .filter(
      (asset) =>
        asset.currentPriceUsd > 0 &&
        asset.marketCap &&
        asset.volume24h > 0 &&
        !excludedSymbols.has(asset.symbol.toUpperCase()) &&
        !(asset.currentPriceUsd > 0.98 && asset.currentPriceUsd < 1.02 && Math.abs(asset.priceChange24h) < 0.5)
    )
    .slice(0, 120)
    .map(buildInsight)
    .sort((a, b) => b.longSetupScore - a.longSetupScore)
    .slice(0, 8);

  return {
    generatedAt: new Date().toISOString(),
    source: isFallback ? "Data cadangan market" : "CoinGecko Markets API",
    analyzedCount: Math.min(assets.length, 120),
    candidates,
    methodology: [
      "Technical: 1h/24h/7d momentum, volume/market cap, RSI proxy, volatility proxy.",
      "Sentiment: market-derived sentiment proxy dari price action, volume activity, dan rank.",
      "News/catalyst: catalyst proxy dari rank, volume, momentum 7d, dan headline categories yang perlu dipantau.",
      "Risk: penalti untuk volatility tinggi, overbought proxy, downside 24h, dan volume ekstrem.",
      "Output adalah watchlist probabilistik, bukan financial advice atau instruksi buy/sell."
    ]
  };
}
