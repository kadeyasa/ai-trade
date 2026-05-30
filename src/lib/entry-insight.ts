import type { EntryInsight } from "@/types/entry";
import type { MarketSeriesPoint, MarketSnapshotView } from "@/types/market";

function roundPrice(value: number) {
  if (value >= 1000) return Number(value.toFixed(2));
  if (value >= 1) return Number(value.toFixed(4));
  return Number(value.toFixed(8));
}

export function createEntryInsight(market: MarketSnapshotView, series: MarketSeriesPoint[]): EntryInsight {
  const prices = series.map((point) => point.priceUsd).filter((price) => price > 0);
  const currentPrice = market.priceUsd;
  const fallbackPrices = prices.length ? prices : [currentPrice];
  const supportPrice = Math.min(...fallbackPrices);
  const resistancePrice = Math.max(...fallbackPrices);
  const averagePrice = fallbackPrices.reduce((sum, price) => sum + price, 0) / fallbackPrices.length;
  const recent = fallbackPrices.slice(-6);
  const recentAverage = recent.reduce((sum, price) => sum + price, 0) / Math.max(1, recent.length);
  const trendPositive = currentPrice >= averagePrice && recentAverage >= averagePrice;
  const range = Math.max(0.00000001, resistancePrice - supportPrice);
  const pullbackZoneLow = supportPrice + range * 0.28;
  const pullbackZoneHigh = supportPrice + range * 0.48;
  const breakoutTrigger = resistancePrice * 1.006;
  const invalidationPrice = supportPrice * 0.985;
  const risk = Math.max(0.00000001, currentPrice - invalidationPrice);
  const targetObservation1 = Math.max(resistancePrice, currentPrice + risk * 1.35);
  const targetObservation2 = currentPrice + risk * 2;
  const riskRewardProxy = (targetObservation1 - currentPrice) / risk;
  const volatility = range / Math.max(0.00000001, currentPrice);

  let setupQuality: EntryInsight["setupQuality"] = "CUKUP";
  if (volatility > 0.22 || market.priceChange24h < -8) setupQuality = "BERISIKO";
  else if (trendPositive && market.priceChange24h > 1.5 && riskRewardProxy >= 1.2) setupQuality = "KUAT";
  else if (!trendPositive || market.priceChange24h < 0) setupQuality = "LEMAH";

  const reasons = [
    trendPositive
      ? "Harga berada di atas rata-rata intraday, momentum masih konstruktif."
      : "Harga belum kuat di atas rata-rata intraday, entry agresif perlu konfirmasi.",
    `Support intraday berada di sekitar ${roundPrice(supportPrice)} dan resistance di sekitar ${roundPrice(resistancePrice)}.`,
    market.priceChange24h >= 0
      ? `Perubahan 24h positif ${market.priceChange24h.toFixed(2)}%, mendukung bias pantauan LONG.`
      : `Perubahan 24h negatif ${market.priceChange24h.toFixed(2)}%, risiko pullback masih perlu diperhatikan.`,
    volatility > 0.16
      ? "Range intraday cukup lebar, gunakan invalidation level untuk menghindari whipsaw."
      : "Range intraday relatif terkendali."
  ];

  return {
    currentPrice: roundPrice(currentPrice),
    supportPrice: roundPrice(supportPrice),
    resistancePrice: roundPrice(resistancePrice),
    pullbackZoneLow: roundPrice(pullbackZoneLow),
    pullbackZoneHigh: roundPrice(pullbackZoneHigh),
    breakoutTrigger: roundPrice(breakoutTrigger),
    invalidationPrice: roundPrice(invalidationPrice),
    targetObservation1: roundPrice(targetObservation1),
    targetObservation2: roundPrice(targetObservation2),
    riskRewardProxy: Number(riskRewardProxy.toFixed(2)),
    setupQuality,
    reasons
  };
}
