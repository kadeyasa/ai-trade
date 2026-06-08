from __future__ import annotations

from datetime import datetime, timedelta, timezone
from math import sqrt, sin

from models import OhlcvCandle, TradingPrediction

FIB_RATIOS = [0.236, 0.382, 0.5, 0.618, 0.786]
FIB_TIME_INTERVALS = [13, 21, 34, 55, 89]


def avg(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0


def rnd(value: float, digits: int = 6) -> float:
    return round(value, digits)


def ema(values: list[float], period: int) -> list[float | None]:
    out: list[float | None] = []
    previous: float | None = None
    multiplier = 2 / (period + 1)
    for index, value in enumerate(values):
        if index < period - 1:
            out.append(None)
            continue
        if previous is None:
            previous = avg(values[index - period + 1 : index + 1])
        else:
            previous = value * multiplier + previous * (1 - multiplier)
        out.append(previous)
    return out


def sma(values: list[float], period: int) -> list[float | None]:
    return [None if index < period - 1 else avg(values[index - period + 1 : index + 1]) for index in range(len(values))]


def rsi(values: list[float], period: int = 14) -> list[float | None]:
    out: list[float | None] = [None] * len(values)
    if len(values) <= period:
        return out
    gains = 0.0
    losses = 0.0
    for index in range(1, period + 1):
        change = values[index] - values[index - 1]
        gains += max(change, 0)
        losses += max(-change, 0)
    avg_gain = gains / period
    avg_loss = losses / period
    out[period] = 100 if avg_loss == 0 else 100 - 100 / (1 + avg_gain / avg_loss)
    for index in range(period + 1, len(values)):
        change = values[index] - values[index - 1]
        avg_gain = (avg_gain * (period - 1) + max(change, 0)) / period
        avg_loss = (avg_loss * (period - 1) + max(-change, 0)) / period
        out[index] = 100 if avg_loss == 0 else 100 - 100 / (1 + avg_gain / avg_loss)
    return out


def atr(candles: list[OhlcvCandle], period: int = 14) -> list[float | None]:
    true_ranges: list[float] = []
    for index, candle in enumerate(candles):
        if index == 0:
            true_ranges.append(candle.high - candle.low)
            continue
        previous_close = candles[index - 1].close
        true_ranges.append(max(candle.high - candle.low, abs(candle.high - previous_close), abs(candle.low - previous_close)))
    return sma(true_ranges, period)


def indicators(candles: list[OhlcvCandle]) -> list[dict]:
    closes = [c.close for c in candles]
    volumes = [c.volume for c in candles]
    ema20 = ema(closes, 20)
    ema50 = ema(closes, 50)
    ema200 = ema(closes, 200)
    ema12 = ema(closes, 12)
    ema26 = ema(closes, 26)
    macd = [(ema12[i] - ema26[i]) if ema12[i] is not None and ema26[i] is not None else None for i in range(len(closes))]
    macd_signal = ema([value or 0 for value in macd], 9)
    rsi14 = rsi(closes)
    volume_ma = sma(volumes, 20)
    atr14 = atr(candles)
    out: list[dict] = []
    for index, candle in enumerate(candles):
        window = closes[max(0, index - 19) : index + 1]
        middle = avg(window) if index >= 19 else None
        std = sqrt(avg([(value - middle) ** 2 for value in window])) if middle is not None else None
        signal = macd_signal[index] if macd[index] is not None else None
        out.append(
            {
                "time": candle.time,
                "ema20": rnd(ema20[index]) if ema20[index] is not None else None,
                "ema50": rnd(ema50[index]) if ema50[index] is not None else None,
                "ema200": rnd(ema200[index]) if ema200[index] is not None else None,
                "rsi14": rnd(rsi14[index], 2) if rsi14[index] is not None else None,
                "macd": rnd(macd[index]) if macd[index] is not None else None,
                "macdSignal": rnd(signal) if signal is not None else None,
                "macdHistogram": rnd(macd[index] - signal) if macd[index] is not None and signal is not None else None,
                "bbUpper": rnd(middle + std * 2) if middle is not None and std is not None else None,
                "bbMiddle": rnd(middle) if middle is not None else None,
                "bbLower": rnd(middle - std * 2) if middle is not None and std is not None else None,
                "volumeMa": rnd(volume_ma[index]) if volume_ma[index] is not None else None,
                "atr": rnd(atr14[index]) if atr14[index] is not None else None,
            }
        )
    return out


def swings(candles: list[OhlcvCandle], lookback: int = 3) -> list[dict]:
    found: list[dict] = []
    for index in range(lookback, len(candles) - lookback):
        window = candles[index - lookback : index + lookback + 1]
        candle = candles[index]
        if candle.high == max(item.high for item in window):
            found.append({"type": "high", "index": index, "time": candle.time, "price": candle.high})
        if candle.low == min(item.low for item in window):
            found.append({"type": "low", "index": index, "time": candle.time, "price": candle.low})
    return found


def simple_wave_analysis(candles: list[OhlcvCandle]) -> dict:
    swing_points = swings(candles, 2)[-8:]
    if len(swing_points) < 3:
        return {
            "status": "UNCLEAR",
            "direction": "NEUTRAL",
            "impulse": [],
            "correction": [],
            "validation": {
                "wave2Retracement": {"valid": False},
                "wave3Extension": {"valid": False},
                "wave4Retracement": {"valid": False},
                "wave5Target": {"valid": False},
            },
            "confidence": 0,
            "currentPhase": "UNCLEAR",
            "message": "Wave unclear / Wait confirmation",
        }
    last = swing_points[-5:]
    direction = "LONG" if last[0]["type"] == "low" else "SHORT"
    labels = ["1", "2", "3", "4", "5"]
    impulse = [
        {"label": labels[index], "time": point["time"], "price": point["price"], "index": point["index"], "type": point["type"]}
        for index, point in enumerate(last)
    ]
    confidence = 45 if len(last) >= 3 else 0
    return {
        "status": "VALID" if confidence >= 45 else "UNCLEAR",
        "direction": direction,
        "impulse": impulse,
        "correction": [],
        "validation": {
            "wave2Retracement": {"valid": len(last) >= 3},
            "wave3Extension": {"valid": len(last) >= 4},
            "wave4Retracement": {"valid": len(last) >= 5},
            "wave5Target": {"valid": False},
        },
        "confidence": confidence,
        "currentPhase": "WAVE_4_DONE" if len(last) >= 5 else "WAVE_2_DONE",
        "message": f"{direction} wave structure detected" if confidence >= 45 else "Wave unclear / Wait confirmation",
    }


def market_structure(candles: list[OhlcvCandle]) -> list[dict]:
    last_high: float | None = None
    last_low: float | None = None
    out: list[dict] = []
    for swing in swings(candles):
        if swing["type"] == "high":
            label = "HH" if last_high is None or swing["price"] > last_high else "LH"
            last_high = swing["price"]
        else:
            label = "HL" if last_low is None or swing["price"] > last_low else "LL"
            last_low = swing["price"]
        out.append({"time": swing["time"], "price": swing["price"], "label": label})
    return out


def levels(values: list[float], tolerance: float) -> list[dict]:
    clusters: list[list[float]] = []
    for value in values:
        matched = next((cluster for cluster in clusters if abs(avg(cluster) - value) <= tolerance), None)
        if matched is not None:
            matched.append(value)
        else:
            clusters.append([value])
    return sorted(
        [{"price": rnd(avg(cluster)), "touches": len(cluster), "strength": rnd(min(1, max(0.2, len(cluster) / 5)), 2)} for cluster in clusters],
        key=lambda item: item["touches"],
        reverse=True,
    )[:3]


def support_resistance(candles: list[OhlcvCandle]) -> tuple[list[dict], list[dict]]:
    recent = candles[-80:]
    price_range = max(c.high for c in recent) - min(c.low for c in recent)
    tolerance = price_range * 0.012 or recent[-1].close * 0.01
    support = sorted(levels([c.low for c in recent], tolerance), key=lambda item: item["price"], reverse=True)
    resistance = sorted(levels([c.high for c in recent], tolerance), key=lambda item: item["price"])
    return support, resistance


def predict(symbol: str, timeframe: str, candles: list[OhlcvCandle]) -> TradingPrediction:
    candles = candles[-240:]
    indicator_rows = indicators(candles)
    latest = candles[-1]
    previous = candles[-2] if len(candles) > 1 else latest
    latest_indicator = indicator_rows[-1]
    support, resistance = support_resistance(candles)
    structure = market_structure(candles)
    wave_analysis = simple_wave_analysis(candles)
    swing_points = swings(candles)
    swing_high = next((s for s in reversed(swing_points) if s["type"] == "high"), None)
    swing_low = next((s for s in reversed(swing_points) if s["type"] == "low"), None)
    high = max(swing_high["price"] if swing_high else latest.high, swing_low["price"] if swing_low else latest.low)
    low = min(swing_high["price"] if swing_high else latest.high, swing_low["price"] if swing_low else latest.low)
    fib = [{"ratio": ratio, "price": rnd(high - (high - low) * ratio)} for ratio in FIB_RATIOS]
    atr_value = latest_indicator.get("atr") or max(latest.high - latest.low, latest.close * 0.01)
    nearest_support = next((level for level in support if level["price"] <= latest.close), support[0] if support else None)
    nearest_resistance = next((level for level in resistance if level["price"] >= latest.close), resistance[0] if resistance else None)
    volume_ma = latest_indicator.get("volumeMa") or 0
    volume_strong = latest.volume > volume_ma * 1.15 if volume_ma else False
    ema20 = latest_indicator.get("ema20")
    ema50 = latest_indicator.get("ema50")
    trend_bullish = ema20 is not None and ema50 is not None and latest.close > ema20 > ema50
    trend_bearish = ema20 is not None and ema50 is not None and latest.close < ema20 < ema50
    macd_hist = latest_indicator.get("macdHistogram") or 0
    rsi_value = latest_indicator.get("rsi14") or 50
    near_fib = any(abs(level["price"] - latest.close) <= atr_value * 0.75 for level in fib)
    breakout = bool(nearest_resistance and latest.close > nearest_resistance["price"] and volume_strong)
    fake_breakout = bool(nearest_resistance and previous.high > nearest_resistance["price"] and latest.close < nearest_resistance["price"] and latest.volume > volume_ma)
    continuation = (trend_bullish and any(item["label"] == "HL" for item in structure[-4:])) or (trend_bearish and any(item["label"] == "LH" for item in structure[-4:]))
    reversal = near_fib or bool(nearest_support and abs(latest.close - nearest_support["price"]) <= atr_value) or bool(nearest_resistance and abs(latest.close - nearest_resistance["price"]) <= atr_value)
    cycle_active = bool(swing_points)
    long_score = sum([trend_bullish, macd_hist > 0, 50 < rsi_value < 72, breakout, continuation and trend_bullish, reversal, cycle_active and latest.close >= (ema20 or latest.close)])
    short_score = sum([trend_bearish, macd_hist < 0, 28 < rsi_value < 50, fake_breakout, continuation and trend_bearish, reversal, cycle_active and latest.close <= (ema20 or latest.close)])
    scenario = "bullish" if long_score >= short_score + 2 else "bearish" if short_score >= long_score + 2 else "sideways"
    spread = long_score - short_score
    if spread >= 3 and long_score >= 5:
        signal = "STRONG_LONG"
    elif spread >= 2 and long_score >= 4:
        signal = "LONG"
    elif spread <= -3 and short_score >= 5:
        signal = "STRONG_SHORT"
    elif spread <= -2 and short_score >= 4:
        signal = "SHORT"
    else:
        signal = "WAIT"
    preferred_direction = "LONG" if signal in ["STRONG_LONG", "LONG"] else "SHORT" if signal in ["STRONG_SHORT", "SHORT"] else "NEUTRAL"
    confluence = [
        {"name": "Trend", "passed": trend_bullish or trend_bearish, "weight": 20, "note": "EMA stack aligned" if trend_bullish or trend_bearish else "EMA stack mixed"},
        {"name": "Volume", "passed": volume_strong, "weight": 12, "note": "Volume above MA" if volume_strong else "Volume below threshold"},
        {"name": "RSI", "passed": 28 < rsi_value < 72 and rsi_value != 50, "weight": 12, "note": f"RSI {rnd(rsi_value, 1)}"},
        {"name": "MACD", "passed": macd_hist != 0, "weight": 14, "note": "Positive histogram" if macd_hist > 0 else "Negative histogram" if macd_hist < 0 else "Flat histogram"},
        {"name": "Fibonacci", "passed": near_fib, "weight": 12, "note": "Near retracement" if near_fib else "No fib confluence"},
        {"name": "Support/Resistance", "passed": breakout or fake_breakout or reversal, "weight": 18, "note": "Key level active" if breakout or fake_breakout or reversal else "Between key levels"},
        {"name": "Time Cycle", "passed": bool(swing_points), "weight": 12, "note": "Swing cycle available" if swing_points else "No swing anchor"},
    ]
    confidence = sum(item["weight"] for item in confluence if item["passed"])
    stop_distance = max(atr_value * 1.5, latest.close * 0.012)
    is_short = preferred_direction == "SHORT"
    stop_loss = latest.close + stop_distance if is_short else latest.close - stop_distance
    tp1 = latest.close - stop_distance * 1.5 if is_short else latest.close + stop_distance * 1.5
    tp2 = latest.close - stop_distance * 2.5 if is_short else latest.close + stop_distance * 2.5
    path = []
    last_time = datetime.fromisoformat(candles[-1].time.replace("Z", "+00:00"))
    interval = (
        datetime.fromisoformat(candles[-1].time.replace("Z", "+00:00")) - datetime.fromisoformat(candles[-2].time.replace("Z", "+00:00"))
        if len(candles) > 1
        else timedelta(hours=1)
    )
    for index in range(24):
        drift = atr_value * 0.18 if scenario == "bullish" else -atr_value * 0.18 if scenario == "bearish" else 0
        wave = sin((index + 1) / 2.8) * atr_value * (0.22 if scenario == "sideways" else 0.12)
        path.append({"time": (last_time + interval * (index + 1)).isoformat(), "price": rnd(max(0, latest.close + drift * (index + 1) + wave))})
    anchor = swing_points[-1] if swing_points else None
    anchor_time = datetime.fromisoformat(anchor["time"].replace("Z", "+00:00")) if anchor else None
    projections = (
        [{"interval": value, "candleIndex": anchor["index"] + value, "projectedTime": (anchor_time + interval * value).isoformat()} for value in FIB_TIME_INTERVALS]
        if anchor and anchor_time
        else []
    )
    return TradingPrediction(
        symbol=symbol,
        timeframe=timeframe,
        candles=candles,
        indicators=indicator_rows,
        marketStructure=structure,
        supportLevels=support,
        resistanceLevels=resistance,
        fibonacciRetracement=fib,
        timeCycles={"swingHigh": swing_high, "swingLow": swing_low, "cycleDistance": abs(swing_high["index"] - swing_low["index"]) if swing_high and swing_low else None, "projections": projections},
        detection={"breakout": breakout, "fakeBreakout": fake_breakout, "trendContinuation": continuation, "potentialReversalZone": reversal},
        waveAnalysis=wave_analysis,
        predictionPath=path,
        scenario=scenario,
        signal=signal,
        preferredDirection=preferred_direction,
        longScore=long_score,
        shortScore=short_score,
        risk={"entryPrice": rnd(latest.close), "stopLoss": rnd(stop_loss), "takeProfit1": rnd(tp1), "takeProfit2": rnd(tp2), "riskRewardRatio": rnd(abs(tp2 - latest.close) / abs(latest.close - stop_loss), 2)},
        confidence=confidence,
        confluence=confluence,
        generatedAt=datetime.now(timezone.utc).isoformat(),
    )
