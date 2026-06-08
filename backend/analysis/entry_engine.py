from __future__ import annotations

from analysis.fibonacci import price_in_zone
from analysis.risk_management import build_risk_plan
from analysis.scoring import score_setup


def analyze_entry(candles: list[dict], indicators: list[dict], structure: list[dict], wave: dict, fib: dict, time_cycle: dict) -> dict:
    latest = candles[-1]
    latest_ind = indicators[-1]
    price = latest["close"]
    trend_bullish = bool(latest_ind.get("ema50") and latest_ind.get("ema200") and latest_ind["ema50"] > latest_ind["ema200"])
    trend_bearish = bool(latest_ind.get("ema50") and latest_ind.get("ema200") and latest_ind["ema50"] < latest_ind["ema200"])
    labels = [item["structure"] for item in structure[-6:]]
    bullish_structure = "HH" in labels and "HL" in labels
    bearish_structure = "LH" in labels and "LL" in labels
    in_golden_zone = price_in_zone(price, fib["golden_zone"])
    rsi = latest_ind.get("rsi14") or 50
    macd_hist = latest_ind.get("macd_histogram") or 0
    previous_macd = indicators[-2].get("macd_histogram") if len(indicators) > 1 else None
    volume_ma = latest_ind.get("volume_ma20") or latest["volume"]
    volume_decreasing = latest["volume"] < volume_ma
    bullish_candle = latest["close"] > latest["open"]
    bearish_candle = latest["close"] < latest["open"]
    macd_improving = previous_macd is not None and macd_hist > previous_macd
    macd_weakening = previous_macd is not None and macd_hist < previous_macd

    long_factors = {
        "trend_structure": trend_bullish and bullish_structure,
        "fibonacci_zone": in_golden_zone,
        "wave_count": wave["current_wave"] in {"wave_2_correction", "wave_4_correction"} or "wave_2" in wave["current_wave"],
        "volume_confirmation": volume_decreasing,
        "momentum": rsi < 45 or macd_improving,
        "time_cycle": time_cycle["cycle_confidence"] >= 50,
    }
    short_factors = {
        "trend_structure": trend_bearish and bearish_structure,
        "fibonacci_zone": in_golden_zone,
        "wave_count": wave["current_wave"] in {"wave_b_rally", "abc_correction"} or wave["wave_status"].startswith("bearish"),
        "volume_confirmation": volume_decreasing,
        "momentum": rsi > 55 or macd_weakening,
        "time_cycle": time_cycle["cycle_confidence"] >= 50,
    }
    long_score = score_setup(long_factors)
    short_score = score_setup(short_factors)
    long_agree = sum(1 for value in long_factors.values() if value)
    short_agree = sum(1 for value in short_factors.values() if value)

    signal = "WAIT"
    factors = long_factors
    score = long_score
    setup_type = "no_trade"
    reasons = []
    if long_agree >= 4 and long_score["score"] >= short_score["score"]:
        signal = "LONG"
        factors = long_factors
        score = long_score
        setup_type = f"{wave['current_wave']}_long"
    elif short_agree >= 4:
        signal = "SHORT"
        factors = short_factors
        score = short_score
        setup_type = f"{wave['current_wave']}_short"

    risk = build_risk_plan(signal, price, latest_ind.get("atr") or price * 0.01, structure, fib)
    if signal != "WAIT" and not risk["valid_rr"]:
        signal = "WAIT"
        setup_type = "no_trade_rr_below_1_2"
    reasons.extend(_reasons(signal, factors, risk, wave))
    return {
        "signal": signal,
        "setup_type": setup_type,
        "confidence": score["score"] if signal != "WAIT" and wave["confidence"] >= 45 else min(score["score"], 50),
        "score_label": score["label"],
        "reason": reasons,
        "risk": risk,
        "factors": factors,
        "scenario": {
            "bullish": long_score["score"],
            "neutral": max(0, 100 - long_score["score"] - short_score["score"]),
            "bearish": short_score["score"],
        },
    }


def _reasons(signal: str, factors: dict, risk: dict, wave: dict) -> list[str]:
    if signal == "WAIT":
        return ["WAIT / NO TRADE: fewer than 4 required confluence factors agree or risk reward is below 1:2."]
    return [
        "Trend reason: market structure and EMA trend support the setup." if factors["trend_structure"] else "Trend reason: trend confirmation is weak.",
        f"Wave reason: {wave['message']}.",
        "Fibonacci reason: price is inside the 0.5-0.618 golden zone." if factors["fibonacci_zone"] else "Fibonacci reason: price is not near golden zone.",
        "Momentum reason: RSI/MACD supports the setup." if factors["momentum"] else "Momentum reason: RSI/MACD is not clean.",
        "Volume reason: counter-trend volume is decreasing." if factors["volume_confirmation"] else "Volume reason: volume does not confirm.",
        f"Risk reward reason: setup risk reward is {risk['risk_reward']}R.",
    ]
