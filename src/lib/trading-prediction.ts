import type {
  FibonacciLevel,
  IndicatorPoint,
  OhlcvCandle,
  PriceLevel,
  StructurePoint,
  TimeCycleProjection,
  TradeDirection,
  TradingPrediction,
  TradingScenario,
  TradingSignal,
  WaveAnalysis,
  WavePoint
} from "@/types/trading-prediction";

const fibRatios = [0.236, 0.382, 0.5, 0.618, 0.786];
const fibTimeIntervals = [13, 21, 34, 55, 89];
const timeframeMinutes: Record<string, number> = {
  "15m": 15,
  "1h": 60,
  "4h": 240,
  "1d": 1440
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number, digits = 6) {
  return Number(value.toFixed(digits));
}

function ema(values: number[], period: number) {
  const output: Array<number | undefined> = [];
  const multiplier = 2 / (period + 1);
  let previous: number | undefined;

  values.forEach((value, index) => {
    if (index < period - 1) {
      output.push(undefined);
      return;
    }
    if (previous == null) previous = average(values.slice(index - period + 1, index + 1));
    else previous = value * multiplier + previous * (1 - multiplier);
    output.push(previous);
  });

  return output;
}

function sma(values: number[], period: number) {
  return values.map((_, index) => (index < period - 1 ? undefined : average(values.slice(index - period + 1, index + 1))));
}

function standardDeviation(values: number[]) {
  const mean = average(values);
  return Math.sqrt(average(values.map((value) => (value - mean) ** 2)));
}

function rsi(values: number[], period = 14) {
  const output: Array<number | undefined> = Array(values.length).fill(undefined);
  if (values.length <= period) return output;

  let gains = 0;
  let losses = 0;
  for (let index = 1; index <= period; index += 1) {
    const change = values[index] - values[index - 1];
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  output[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let index = period + 1; index < values.length; index += 1) {
    const change = values[index] - values[index - 1];
    avgGain = (avgGain * (period - 1) + Math.max(change, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-change, 0)) / period;
    output[index] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  return output;
}

function atr(candles: OhlcvCandle[], period = 14) {
  const trueRanges = candles.map((candle, index) => {
    if (index === 0) return candle.high - candle.low;
    const previousClose = candles[index - 1].close;
    return Math.max(candle.high - candle.low, Math.abs(candle.high - previousClose), Math.abs(candle.low - previousClose));
  });
  return sma(trueRanges, period);
}

function buildIndicators(candles: OhlcvCandle[]): IndicatorPoint[] {
  const closes = candles.map((candle) => candle.close);
  const volumes = candles.map((candle) => candle.volume);
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const ema200 = ema(closes, 200);
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = closes.map((_, index) => (ema12[index] != null && ema26[index] != null ? ema12[index]! - ema26[index]! : undefined));
  const macdSignal = ema(macdLine.map((value) => value ?? 0), 9);
  const rsi14 = rsi(closes, 14);
  const volumeMa = sma(volumes, 20);
  const atr14 = atr(candles, 14);

  return candles.map((candle, index) => {
    const bbWindow = closes.slice(Math.max(0, index - 19), index + 1);
    const bbMiddle = index >= 19 ? average(bbWindow) : undefined;
    const bbStd = index >= 19 ? standardDeviation(bbWindow) : undefined;
    const macd = macdLine[index];
    const signal = macd != null && macdSignal[index] != null ? macdSignal[index] : undefined;

    return {
      time: candle.time,
      ema20: ema20[index] == null ? undefined : round(ema20[index]!),
      ema50: ema50[index] == null ? undefined : round(ema50[index]!),
      ema200: ema200[index] == null ? undefined : round(ema200[index]!),
      rsi14: rsi14[index] == null ? undefined : round(rsi14[index]!, 2),
      macd: macd == null ? undefined : round(macd),
      macdSignal: signal == null ? undefined : round(signal),
      macdHistogram: macd == null || signal == null ? undefined : round(macd - signal),
      bbUpper: bbMiddle == null || bbStd == null ? undefined : round(bbMiddle + bbStd * 2),
      bbMiddle: bbMiddle == null ? undefined : round(bbMiddle),
      bbLower: bbMiddle == null || bbStd == null ? undefined : round(bbMiddle - bbStd * 2),
      volumeMa: volumeMa[index] == null ? undefined : round(volumeMa[index]!),
      atr: atr14[index] == null ? undefined : round(atr14[index]!)
    };
  });
}

function findSwings(candles: OhlcvCandle[], lookback = 3) {
  const swings: Array<{ type: "high" | "low"; index: number; time: string; price: number }> = [];
  for (let index = lookback; index < candles.length - lookback; index += 1) {
    const window = candles.slice(index - lookback, index + lookback + 1);
    const candle = candles[index];
    if (candle.high === Math.max(...window.map((item) => item.high))) swings.push({ type: "high", index, time: candle.time, price: candle.high });
    if (candle.low === Math.min(...window.map((item) => item.low))) swings.push({ type: "low", index, time: candle.time, price: candle.low });
  }
  return swings;
}

function simplifySwings(swings: Array<{ type: "high" | "low"; index: number; time: string; price: number }>) {
  const simplified: typeof swings = [];
  swings.forEach((swing) => {
    const previous = simplified.at(-1);
    if (!previous || previous.type !== swing.type) {
      simplified.push(swing);
      return;
    }
    const isMoreExtreme = swing.type === "high" ? swing.price > previous.price : swing.price < previous.price;
    if (isMoreExtreme) simplified[simplified.length - 1] = swing;
  });
  return simplified;
}

function ratio(value?: number) {
  if (value == null || !Number.isFinite(value)) return undefined;
  return round(value, 3);
}

function wavePoint(label: WavePoint["label"], swing: { type: "high" | "low"; index: number; time: string; price: number }): WavePoint {
  return { label, type: swing.type, index: swing.index, time: swing.time, price: swing.price };
}

function detectWaveAnalysis(candles: OhlcvCandle[]): WaveAnalysis {
  const swings = simplifySwings(findSwings(candles, 2));
  const latestClose = candles.at(-1)?.close ?? 0;
  let best: WaveAnalysis = {
    status: "UNCLEAR",
    direction: "NEUTRAL",
    impulse: [],
    correction: [],
    validation: {
      wave2Retracement: { valid: false },
      wave3Extension: { valid: false },
      wave4Retracement: { valid: false },
      wave5Target: { valid: false }
    },
    confidence: 0,
    currentPhase: "UNCLEAR",
    message: "Wave unclear / Wait confirmation"
  };

  const partial = swings.slice(-5);
  if (partial.length >= 3) {
    const last3 = partial.slice(-3);
    const bullish2 = last3.map((point) => point.type).join("-") === "low-high-low";
    const bearish2 = last3.map((point) => point.type).join("-") === "high-low-high";
    if (bullish2 || bearish2) {
      const direction: TradeDirection = bullish2 ? "LONG" : "SHORT";
      const w1 = Math.abs(last3[1].price - last3[0].price);
      const w2 = Math.abs(last3[1].price - last3[2].price);
      const wave2Retracement = ratio(w2 / w1);
      const validWave2 = wave2Retracement != null && wave2Retracement >= 0.382 && wave2Retracement <= 0.786;
      best = {
        ...best,
        status: validWave2 ? "VALID" : "UNCLEAR",
        direction,
        impulse: [wavePoint("1", last3[1]), wavePoint("2", last3[2])],
        validation: {
          ...best.validation,
          wave2Retracement: { value: wave2Retracement, valid: validWave2 }
        },
        confidence: validWave2 ? 48 : 24,
        currentPhase: validWave2 ? "WAVE_2_DONE" : "UNCLEAR",
        message: validWave2 ? `${direction} Wave 2 retracement complete` : "Wave unclear / Wait confirmation"
      };
    }
  }

  if (partial.length >= 5) {
    const last5 = partial.slice(-5);
    const bullish4 = last5.map((point) => point.type).join("-") === "low-high-low-high-low";
    const bearish4 = last5.map((point) => point.type).join("-") === "high-low-high-low-high";
    if (bullish4 || bearish4) {
      const direction: TradeDirection = bullish4 ? "LONG" : "SHORT";
      const w1 = Math.abs(last5[1].price - last5[0].price);
      const w2 = Math.abs(last5[1].price - last5[2].price);
      const w3 = Math.abs(last5[3].price - last5[2].price);
      const w4 = Math.abs(last5[3].price - last5[4].price);
      const wave2Retracement = ratio(w2 / w1);
      const wave3Extension = ratio(w3 / w1);
      const wave4Retracement = ratio(w4 / w3);
      const validation = {
        wave2Retracement: { value: wave2Retracement, valid: wave2Retracement != null && wave2Retracement >= 0.382 && wave2Retracement <= 0.786 },
        wave3Extension: { value: wave3Extension, valid: wave3Extension != null && wave3Extension >= 1.35 },
        wave4Retracement: { value: wave4Retracement, valid: wave4Retracement != null && wave4Retracement >= 0.236 && wave4Retracement <= 0.5 },
        wave5Target: { valid: false }
      };
      const validCount = Object.values(validation).filter((item) => item.valid).length;
      const confidence = clamp(validCount * 20, 0, 78);
      if (confidence >= best.confidence) {
        best = {
          status: confidence >= 45 ? "VALID" : "UNCLEAR",
          direction,
          impulse: last5.slice(1).map((point, index) => wavePoint(String(index + 1) as WavePoint["label"], point)),
          correction: [],
          validation,
          confidence,
          currentPhase: confidence >= 45 ? "WAVE_4_DONE" : "UNCLEAR",
          message: confidence >= 45 ? `${direction} Wave 4 retracement complete` : "Wave unclear / Wait confirmation"
        };
      }
    }
  }

  for (let start = Math.max(0, swings.length - 13); start <= swings.length - 6; start += 1) {
    const points = swings.slice(start, start + 6);
    const bullish = points.map((point) => point.type).join("-") === "low-high-low-high-low-high";
    const bearish = points.map((point) => point.type).join("-") === "high-low-high-low-high-low";
    if (!bullish && !bearish) continue;

    const direction: TradeDirection = bullish ? "LONG" : "SHORT";
    const signed = (from: number, to: number) => (bullish ? to - from : from - to);
    const w1 = signed(points[0].price, points[1].price);
    const w2 = signed(points[2].price, points[1].price);
    const w3 = signed(points[2].price, points[3].price);
    const w4 = signed(points[4].price, points[3].price);
    const w5 = signed(points[4].price, points[5].price);
    if (w1 <= 0 || w2 <= 0 || w3 <= 0 || w4 <= 0 || w5 <= 0) continue;

    const wave2Retracement = ratio(w2 / w1);
    const wave3Extension = ratio(w3 / w1);
    const wave4Retracement = ratio(w4 / w3);
    const wave5VsWave1 = ratio(w5 / w1);
    const wave5VsWave3 = ratio(w5 / w3);
    const validation = {
      wave2Retracement: { value: wave2Retracement, valid: wave2Retracement != null && wave2Retracement >= 0.382 && wave2Retracement <= 0.786 },
      wave3Extension: { value: wave3Extension, valid: wave3Extension != null && wave3Extension >= 1.35 },
      wave4Retracement: { value: wave4Retracement, valid: wave4Retracement != null && wave4Retracement >= 0.236 && wave4Retracement <= 0.5 },
      wave5Target: {
        value: wave5VsWave1,
        valid:
          (wave5VsWave1 != null && wave5VsWave1 >= 0.618 && wave5VsWave1 <= 1) ||
          (wave5VsWave3 != null && wave5VsWave3 >= 0.618 && wave5VsWave3 <= 1)
      }
    };
    const validCount = Object.values(validation).filter((item) => item.valid).length;
    const wave5Complete = bullish ? latestClose < points[5].price : latestClose > points[5].price;
    const correctionSwings = swings.slice(start + 6, start + 9);
    const correctionPattern = bullish ? "low-high-low" : "high-low-high";
    const correction =
      correctionSwings.map((point) => point.type).join("-") === correctionPattern
        ? correctionSwings.map((point, index) => wavePoint(["A", "B", "C"][index] as WavePoint["label"], point))
        : [];
    const confidence = clamp(validCount * 18 + (wave5Complete ? 12 : 0) + (correction.length === 3 ? 16 : 0), 0, 100);
    const currentPhase = correction.length === 3 ? "CORRECTION_ABC" : wave5Complete ? "WAVE_5_DONE" : points[4].index > points[2].index ? "WAVE_4_DONE" : "UNCLEAR";
    const candidate: WaveAnalysis = {
      status: confidence >= 45 ? "VALID" : "UNCLEAR",
      direction,
      impulse: points.map((point, index) => wavePoint(String(index + 1) as WavePoint["label"], point)),
      correction,
      validation,
      confidence,
      currentPhase,
      message: confidence >= 45 ? `${direction} impulse wave detected` : "Wave unclear / Wait confirmation"
    };

    if (candidate.confidence >= best.confidence) best = candidate;
  }

  return best;
}

function marketStructure(candles: OhlcvCandle[]): StructurePoint[] {
  const swings = findSwings(candles);
  let lastHigh: number | undefined;
  let lastLow: number | undefined;

  return swings.map((swing) => {
    if (swing.type === "high") {
      const label = lastHigh == null || swing.price > lastHigh ? "HH" : "LH";
      lastHigh = swing.price;
      return { time: swing.time, price: swing.price, label };
    }
    const label = lastLow == null || swing.price > lastLow ? "HL" : "LL";
    lastLow = swing.price;
    return { time: swing.time, price: swing.price, label };
  });
}

function clusteredLevels(values: number[], tolerance: number): PriceLevel[] {
  const clusters: number[][] = [];
  values.forEach((value) => {
    const cluster = clusters.find((items) => Math.abs(average(items) - value) <= tolerance);
    if (cluster) cluster.push(value);
    else clusters.push([value]);
  });

  return clusters
    .map((items) => ({ price: round(average(items)), touches: items.length, strength: round(clamp(items.length / 5, 0.2, 1), 2) }))
    .sort((a, b) => b.touches - a.touches)
    .slice(0, 3);
}

function supportResistance(candles: OhlcvCandle[]) {
  const recent = candles.slice(-80);
  const priceRange = Math.max(...recent.map((candle) => candle.high)) - Math.min(...recent.map((candle) => candle.low));
  const tolerance = priceRange * 0.012 || recent.at(-1)!.close * 0.01;
  return {
    supportLevels: clusteredLevels(recent.map((candle) => candle.low), tolerance).sort((a, b) => b.price - a.price),
    resistanceLevels: clusteredLevels(recent.map((candle) => candle.high), tolerance).sort((a, b) => a.price - b.price)
  };
}

function fibonacciRetracement(candles: OhlcvCandle[]): FibonacciLevel[] {
  const swings = findSwings(candles);
  const lastHigh = [...swings].reverse().find((swing) => swing.type === "high") ?? { price: Math.max(...candles.map((candle) => candle.high)) };
  const lastLow = [...swings].reverse().find((swing) => swing.type === "low") ?? { price: Math.min(...candles.map((candle) => candle.low)) };
  const high = Math.max(lastHigh.price, lastLow.price);
  const low = Math.min(lastHigh.price, lastLow.price);
  return fibRatios.map((ratio) => ({ ratio, price: round(high - (high - low) * ratio) }));
}

function addCandles(time: string, candlesToAdd: number, intervalMs: number) {
  return new Date(new Date(time).getTime() + candlesToAdd * intervalMs).toISOString();
}

function timeCycles(candles: OhlcvCandle[]) {
  const swings = findSwings(candles);
  const swingHigh = [...swings].reverse().find((swing) => swing.type === "high");
  const swingLow = [...swings].reverse().find((swing) => swing.type === "low");
  const anchor = swings.at(-1);
  const intervalMs = candles.length > 1 ? new Date(candles.at(-1)!.time).getTime() - new Date(candles.at(-2)!.time).getTime() : 60 * 60 * 1000;
  const cycleDistance = swingHigh && swingLow ? Math.abs(swingHigh.index - swingLow.index) : undefined;
  const projections: TimeCycleProjection[] = anchor
    ? fibTimeIntervals.map((interval) => ({
        interval,
        candleIndex: anchor.index + interval,
        projectedTime: addCandles(anchor.time, interval, intervalMs)
      }))
    : [];

  return { swingHigh, swingLow, cycleDistance, projections };
}

function predictionPath(candles: OhlcvCandle[], scenario: TradingScenario, steps: number, atrValue: number) {
  const last = candles.at(-1)!;
  const intervalMs = candles.length > 1 ? new Date(last.time).getTime() - new Date(candles.at(-2)!.time).getTime() : 60 * 60 * 1000;
  const drift = scenario === "bullish" ? atrValue * 0.18 : scenario === "bearish" ? -atrValue * 0.18 : 0;
  return Array.from({ length: steps }, (_, index) => {
    const wave = Math.sin((index + 1) / 2.8) * atrValue * (scenario === "sideways" ? 0.22 : 0.12);
    return {
      time: addCandles(last.time, index + 1, intervalMs),
      price: round(Math.max(0, last.close + drift * (index + 1) + wave))
    };
  });
}

function tradeDirection(signal: TradingSignal): TradeDirection {
  if (signal === "STRONG_LONG" || signal === "LONG") return "LONG";
  if (signal === "STRONG_SHORT" || signal === "SHORT") return "SHORT";
  return "NEUTRAL";
}

function tradingSignal(longScore: number, shortScore: number): TradingSignal {
  const spread = longScore - shortScore;
  if (spread >= 3 && longScore >= 5) return "STRONG_LONG";
  if (spread >= 2 && longScore >= 4) return "LONG";
  if (spread <= -3 && shortScore >= 5) return "STRONG_SHORT";
  if (spread <= -2 && shortScore >= 4) return "SHORT";
  return "WAIT";
}

function hasBearishDivergence(candles: OhlcvCandle[], indicators: IndicatorPoint[]) {
  const swings = simplifySwings(findSwings(candles, 2)).filter((point) => point.type === "high").slice(-2);
  if (swings.length < 2) return false;
  const [previous, current] = swings;
  const previousRsi = indicators[previous.index]?.rsi14;
  const currentRsi = indicators[current.index]?.rsi14;
  const previousMacd = indicators[previous.index]?.macdHistogram;
  const currentMacd = indicators[current.index]?.macdHistogram;
  return (
    current.price > previous.price &&
    ((previousRsi != null && currentRsi != null && currentRsi < previousRsi) ||
      (previousMacd != null && currentMacd != null && currentMacd < previousMacd))
  );
}

function finalTradingSignal(input: {
  trendBullish: boolean;
  wave: WaveAnalysis;
  nearFib: boolean;
  nearResistance: boolean;
  volumeStrong: boolean;
  volumeWeak: boolean;
  rsiBullish: boolean;
  macdBullish: boolean;
  bearishDivergence: boolean;
  longScore: number;
  shortScore: number;
}): TradingSignal {
  const buyAllowed =
    input.trendBullish &&
    input.wave.direction === "LONG" &&
    (input.wave.currentPhase === "WAVE_2_DONE" || input.wave.currentPhase === "WAVE_4_DONE") &&
    input.nearFib &&
    input.volumeStrong &&
    input.rsiBullish &&
    input.macdBullish;
  if (buyAllowed) return input.wave.confidence >= 70 ? "STRONG_LONG" : "LONG";

  const sellAllowed =
    input.wave.currentPhase === "WAVE_5_DONE" &&
    input.nearResistance &&
    input.bearishDivergence &&
    input.volumeWeak;
  if (sellAllowed) return input.wave.confidence >= 70 ? "STRONG_SHORT" : "SHORT";

  return tradingSignal(input.longScore, input.shortScore);
}

export function createTradingPrediction(input: { symbol: string; timeframe?: string; candles: OhlcvCandle[] }): TradingPrediction {
  const candles = input.candles.slice(-240);
  const indicators = buildIndicators(candles);
  const latest = candles.at(-1)!;
  const latestIndicator = indicators.at(-1)!;
  const previous = candles.at(-2) ?? latest;
  const structure = marketStructure(candles);
  const waveAnalysis = detectWaveAnalysis(candles);
  const { supportLevels, resistanceLevels } = supportResistance(candles);
  const fibLevels = fibonacciRetracement(candles);
  const cycles = timeCycles(candles);
  const atrValue = latestIndicator.atr ?? Math.max(latest.high - latest.low, latest.close * 0.01);
  const nearestSupport = supportLevels.find((level) => level.price <= latest.close) ?? supportLevels.at(0);
  const nearestResistance = resistanceLevels.find((level) => level.price >= latest.close) ?? resistanceLevels.at(0);
  const volumeStrong = latestIndicator.volumeMa != null && latest.volume > latestIndicator.volumeMa * 1.15;
  const volumeWeak = latestIndicator.volumeMa != null && latest.volume < latestIndicator.volumeMa * 0.85;
  const trendBullish = latestIndicator.ema20 != null && latestIndicator.ema50 != null && latest.close > latestIndicator.ema20 && latestIndicator.ema20 > latestIndicator.ema50;
  const trendBearish = latestIndicator.ema20 != null && latestIndicator.ema50 != null && latest.close < latestIndicator.ema20 && latestIndicator.ema20 < latestIndicator.ema50;
  const macdBullish = (latestIndicator.macdHistogram ?? 0) > 0;
  const macdBearish = (latestIndicator.macdHistogram ?? 0) < 0;
  const rsiValue = latestIndicator.rsi14 ?? 50;
  const rsiBullish = rsiValue > 50 && rsiValue < 72;
  const rsiBearish = rsiValue < 50 && rsiValue > 28;
  const nearFib = fibLevels.some((level) => Math.abs(level.price - latest.close) <= atrValue * 0.75);
  const nearResistance = Boolean(nearestResistance && Math.abs(latest.close - nearestResistance.price) <= atrValue * 1.2);
  const bearishDivergence = hasBearishDivergence(candles, indicators);
  const breakout = Boolean(nearestResistance && latest.close > nearestResistance.price && volumeStrong);
  const fakeBreakout = Boolean(nearestResistance && previous.high > nearestResistance.price && latest.close < nearestResistance.price && latest.volume > (latestIndicator.volumeMa ?? 0));
  const trendContinuation = (trendBullish && structure.slice(-4).some((item) => item.label === "HL")) || (trendBearish && structure.slice(-4).some((item) => item.label === "LH"));
  const potentialReversalZone = nearFib || Boolean(nearestSupport && Math.abs(latest.close - nearestSupport.price) <= atrValue) || Boolean(nearestResistance && Math.abs(latest.close - nearestResistance.price) <= atrValue);
  const cycleSoon = cycles.projections.some((projection) => projection.candleIndex - candles.length <= 5 && projection.candleIndex >= candles.length);

  const longScore = [trendBullish, macdBullish, rsiBullish, breakout, trendContinuation && trendBullish, potentialReversalZone && nearestSupport && latest.close >= nearestSupport.price, cycleSoon && latest.close >= (latestIndicator.ema20 ?? latest.close)].filter(Boolean).length;
  const shortScore = [trendBearish, macdBearish, rsiBearish, fakeBreakout, trendContinuation && trendBearish, potentialReversalZone && nearestResistance && latest.close <= nearestResistance.price, cycleSoon && latest.close <= (latestIndicator.ema20 ?? latest.close)].filter(Boolean).length;
  const scenario: TradingScenario = longScore >= shortScore + 2 ? "bullish" : shortScore >= longScore + 2 ? "bearish" : "sideways";
  const signal = finalTradingSignal({
    trendBullish,
    wave: waveAnalysis,
    nearFib,
    nearResistance,
    volumeStrong,
    volumeWeak,
    rsiBullish,
    macdBullish,
    bearishDivergence,
    longScore,
    shortScore
  });
  const preferredDirection = tradeDirection(signal);

  const confluence = [
    { name: "Trend", passed: trendBullish || trendBearish, weight: 20, note: trendBullish ? "EMA stack bullish" : trendBearish ? "EMA stack bearish" : "EMA stack mixed" },
    { name: "Volume", passed: volumeStrong, weight: 12, note: volumeStrong ? "Volume above MA" : "Volume below confirmation threshold" },
    { name: "RSI", passed: rsiBullish || rsiBearish, weight: 12, note: `RSI ${round(rsiValue, 1)}` },
    { name: "MACD", passed: macdBullish || macdBearish, weight: 14, note: macdBullish ? "Positive histogram" : macdBearish ? "Negative histogram" : "Flat histogram" },
    { name: "Fibonacci", passed: nearFib, weight: 12, note: nearFib ? "Price near retracement level" : "No close fib confluence" },
    { name: "Support/Resistance", passed: breakout || fakeBreakout || potentialReversalZone, weight: 18, note: breakout ? "Breakout confirmed" : fakeBreakout ? "Fake breakout risk" : potentialReversalZone ? "Near key level" : "Between key levels" },
    { name: "Time Cycle", passed: cycleSoon, weight: 10, note: cycleSoon ? "Fib time window approaching" : "No near cycle window" },
    { name: "Wave Count", passed: waveAnalysis.status === "VALID", weight: 12, note: waveAnalysis.message }
  ];
  const confidence = confluence.reduce((sum, item) => sum + (item.passed ? item.weight : 0), 0);
  const entryPrice = latest.close;
  const stopDistance = Math.max(atrValue * 1.5, latest.close * 0.012);
  const isShort = preferredDirection === "SHORT";
  const stopLoss = isShort ? entryPrice + stopDistance : entryPrice - stopDistance;
  const takeProfit1 = isShort ? entryPrice - stopDistance * 1.5 : entryPrice + stopDistance * 1.5;
  const takeProfit2 = isShort ? entryPrice - stopDistance * 2.5 : entryPrice + stopDistance * 2.5;

  return {
    symbol: input.symbol,
    timeframe: input.timeframe ?? "1h",
    candles,
    indicators,
    marketStructure: structure,
    supportLevels,
    resistanceLevels,
    fibonacciRetracement: fibLevels,
    timeCycles: {
      swingHigh: cycles.swingHigh,
      swingLow: cycles.swingLow,
      cycleDistance: cycles.cycleDistance,
      projections: cycles.projections
    },
    detection: { breakout, fakeBreakout, trendContinuation, potentialReversalZone },
    waveAnalysis,
    predictionPath: predictionPath(candles, scenario, 24, atrValue),
    scenario,
    signal,
    preferredDirection,
    longScore,
    shortScore,
    risk: {
      entryPrice: round(entryPrice),
      stopLoss: round(stopLoss),
      takeProfit1: round(takeProfit1),
      takeProfit2: round(takeProfit2),
      riskRewardRatio: round(Math.abs(takeProfit2 - entryPrice) / Math.abs(entryPrice - stopLoss), 2)
    },
    confidence,
    confluence,
    generatedAt: new Date().toISOString()
  };
}

export function marketSeriesToOhlcv(series: Array<{ time: string; priceUsd: number; volume24h: number }>): OhlcvCandle[] {
  return series.map((point, index) => {
    const previous = series[index - 1]?.priceUsd ?? point.priceUsd;
    const next = series[index + 1]?.priceUsd ?? point.priceUsd;
    const spread = Math.max(Math.abs(point.priceUsd - previous), Math.abs(next - point.priceUsd), point.priceUsd * 0.003);
    return {
      time: point.time,
      open: round(previous),
      high: round(Math.max(previous, point.priceUsd, next) + spread * 0.45),
      low: round(Math.max(0, Math.min(previous, point.priceUsd, next) - spread * 0.45)),
      close: round(point.priceUsd),
      volume: Math.max(0, point.volume24h)
    };
  });
}

export function aggregateOhlcvByTimeframe(candles: OhlcvCandle[], timeframe = "1h"): OhlcvCandle[] {
  const minutes = timeframeMinutes[timeframe] ?? timeframeMinutes["1h"];
  const bucketMs = minutes * 60 * 1000;
  const buckets = new Map<number, OhlcvCandle[]>();

  candles.forEach((candle) => {
    const bucket = Math.floor(new Date(candle.time).getTime() / bucketMs) * bucketMs;
    buckets.set(bucket, [...(buckets.get(bucket) ?? []), candle]);
  });

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([bucket, items]) => ({
      time: new Date(bucket).toISOString(),
      open: items[0].open,
      high: Math.max(...items.map((item) => item.high)),
      low: Math.min(...items.map((item) => item.low)),
      close: items.at(-1)!.close,
      volume: items.reduce((sum, item) => sum + item.volume, 0)
    }));
}
