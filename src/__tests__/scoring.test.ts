import { describe, expect, it } from "vitest";
import { mockMarket, mockNews, mockSocialTrend } from "@/lib/mock-data";
import { createPrediction, scoreLiquidityHealth, scoreMarketMomentum } from "@/lib/scoring";

describe("signal scoring engine", () => {
  it("returns normalized probabilities", () => {
    const prediction = createPrediction({
      market: mockMarket,
      social: mockSocialTrend,
      news: mockNews
    });

    const total =
      prediction.bullishProbability + prediction.bearishProbability + prediction.sidewaysProbability;

    expect(total).toBeGreaterThan(0.99);
    expect(total).toBeLessThan(1.01);
    expect(prediction.confidence).toBeGreaterThanOrEqual(0);
    expect(prediction.confidence).toBeLessThanOrEqual(1);
    expect(prediction.reasons.length).toBeGreaterThan(0);
  });

  it("rewards stronger market momentum", () => {
    const weak = scoreMarketMomentum({ ...mockMarket, priceChange24h: -12, txnsBuy24h: 90, txnsSell24h: 260 });
    const strong = scoreMarketMomentum({ ...mockMarket, priceChange24h: 18, txnsBuy24h: 360, txnsSell24h: 120 });

    expect(strong).toBeGreaterThan(weak);
  });

  it("penalizes stressed liquidity", () => {
    const healthy = scoreLiquidityHealth({ ...mockMarket, liquidityUsd: 800000, volume24h: 50000 });
    const stressed = scoreLiquidityHealth({ ...mockMarket, liquidityUsd: 40000, volume24h: 120000 });

    expect(healthy).toBeGreaterThan(stressed);
  });
});
