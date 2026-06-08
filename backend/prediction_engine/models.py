from typing import Literal

from pydantic import BaseModel, Field


class OhlcvCandle(BaseModel):
    time: str
    open: float
    high: float
    low: float
    close: float
    volume: float


class PredictionRequest(BaseModel):
    symbol: str
    timeframe: str = "1h"
    candles: list[OhlcvCandle] = Field(min_length=20)


class IndicatorPoint(BaseModel):
    time: str
    ema20: float | None = None
    ema50: float | None = None
    ema200: float | None = None
    rsi14: float | None = None
    macd: float | None = None
    macdSignal: float | None = None
    macdHistogram: float | None = None
    bbUpper: float | None = None
    bbMiddle: float | None = None
    bbLower: float | None = None
    volumeMa: float | None = None
    atr: float | None = None


class PriceLevel(BaseModel):
    price: float
    touches: int
    strength: float


class RiskPlan(BaseModel):
    entryPrice: float
    stopLoss: float
    takeProfit1: float
    takeProfit2: float
    riskRewardRatio: float


class TradingPrediction(BaseModel):
    symbol: str
    timeframe: str
    candles: list[OhlcvCandle]
    indicators: list[IndicatorPoint]
    marketStructure: list[dict]
    supportLevels: list[PriceLevel]
    resistanceLevels: list[PriceLevel]
    fibonacciRetracement: list[dict]
    timeCycles: dict
    detection: dict
    waveAnalysis: dict
    predictionPath: list[dict]
    scenario: Literal["bullish", "bearish", "sideways"]
    signal: Literal["STRONG_LONG", "LONG", "WAIT", "SHORT", "STRONG_SHORT"]
    preferredDirection: Literal["LONG", "SHORT", "NEUTRAL"]
    longScore: int
    shortScore: int
    risk: RiskPlan
    confidence: int
    confluence: list[dict]
    generatedAt: str
