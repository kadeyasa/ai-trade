export type TradingSignal = "STRONG_LONG" | "LONG" | "WAIT" | "SHORT" | "STRONG_SHORT";
export type TradingScenario = "bullish" | "bearish" | "sideways";
export type TradeDirection = "LONG" | "SHORT" | "NEUTRAL";
export type MarketStructureLabel = "HH" | "HL" | "LH" | "LL";
export type WaveLabel = "1" | "2" | "3" | "4" | "5" | "A" | "B" | "C";

export type OhlcvCandle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type IndicatorPoint = {
  time: string;
  ema20?: number;
  ema50?: number;
  ema200?: number;
  rsi14?: number;
  macd?: number;
  macdSignal?: number;
  macdHistogram?: number;
  bbUpper?: number;
  bbMiddle?: number;
  bbLower?: number;
  volumeMa?: number;
  atr?: number;
};

export type StructurePoint = {
  time: string;
  price: number;
  label: MarketStructureLabel;
};

export type PriceLevel = {
  price: number;
  touches: number;
  strength: number;
};

export type FibonacciLevel = {
  ratio: number;
  price: number;
};

export type TimeCycleProjection = {
  interval: number;
  candleIndex: number;
  projectedTime: string;
};

export type PredictionPathPoint = {
  time: string;
  price: number;
};

export type RiskPlan = {
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  riskRewardRatio: number;
};

export type WavePoint = {
  label: WaveLabel;
  time: string;
  price: number;
  index: number;
  type: "high" | "low";
};

export type WaveValidation = {
  wave2Retracement: { value?: number; valid: boolean };
  wave3Extension: { value?: number; valid: boolean };
  wave4Retracement: { value?: number; valid: boolean };
  wave5Target: { value?: number; valid: boolean };
};

export type WaveAnalysis = {
  status: "VALID" | "UNCLEAR";
  direction: TradeDirection;
  impulse: WavePoint[];
  correction: WavePoint[];
  validation: WaveValidation;
  confidence: number;
  currentPhase: "WAVE_2_DONE" | "WAVE_4_DONE" | "WAVE_5_DONE" | "CORRECTION_ABC" | "UNCLEAR";
  message: string;
};

export type TradingPrediction = {
  symbol: string;
  timeframe: string;
  candles: OhlcvCandle[];
  indicators: IndicatorPoint[];
  marketStructure: StructurePoint[];
  supportLevels: PriceLevel[];
  resistanceLevels: PriceLevel[];
  fibonacciRetracement: FibonacciLevel[];
  timeCycles: {
    swingHigh?: { time: string; price: number; index: number };
    swingLow?: { time: string; price: number; index: number };
    cycleDistance?: number;
    projections: TimeCycleProjection[];
  };
  detection: {
    breakout: boolean;
    fakeBreakout: boolean;
    trendContinuation: boolean;
    potentialReversalZone: boolean;
  };
  waveAnalysis: WaveAnalysis;
  predictionPath: PredictionPathPoint[];
  scenario: TradingScenario;
  signal: TradingSignal;
  preferredDirection: TradeDirection;
  longScore: number;
  shortScore: number;
  risk: RiskPlan;
  confidence: number;
  confluence: Array<{ name: string; passed: boolean; weight: number; note: string }>;
  generatedAt: string;
};
