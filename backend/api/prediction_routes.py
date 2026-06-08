from __future__ import annotations

from fastapi import APIRouter

from analysis.entry_engine import analyze_entry
from analysis.fibonacci import calculate_fibonacci
from analysis.swing_detector import classify_market_structure, detect_swings, structure_bias
from analysis.time_cycle import analyze_time_cycle
from analysis.wave_detection import detect_waves
from indicators.indicator_engine import calculate_indicators
from market_data.fetch_ohlcv import fetch_ohlcv, normalize_symbol

router = APIRouter()


@router.get("/api/prediction")
def prediction(symbol: str = "BTCUSDT", timeframe: str = "1h", limit: int = 240) -> dict:
    candles = fetch_ohlcv(symbol, timeframe, limit)
    indicators = calculate_indicators(candles)
    swings = detect_swings(candles, 3)
    structure = classify_market_structure(swings)
    trend = structure_bias(structure)
    anchor_lows = [item["price"] for item in swings if item["type"] == "low"]
    anchor_highs = [item["price"] for item in swings if item["type"] == "high"]
    anchor_low = anchor_lows[-1] if anchor_lows else min(candle["low"] for candle in candles)
    anchor_high = anchor_highs[-1] if anchor_highs else max(candle["high"] for candle in candles)
    fib = calculate_fibonacci(anchor_low, anchor_high, trend)
    wave = detect_waves(swings, candles[-1]["close"])
    time_cycle = analyze_time_cycle(swings, len(candles))
    entry = analyze_entry(candles, indicators, structure, wave, fib, time_cycle)

    return {
        "symbol": normalize_symbol(symbol),
        "timeframe": timeframe,
        "signal": entry["signal"],
        "setup_type": entry["setup_type"],
        "confidence": entry["confidence"],
        "trend": trend,
        "entry_zone": fib["golden_zone"],
        "entry_trigger": "break above confirmation candle high" if entry["signal"] == "LONG" else "break below confirmation candle low" if entry["signal"] == "SHORT" else "wait confirmation",
        "stop_loss": entry["risk"]["stop_loss"],
        "take_profit_1": entry["risk"]["take_profit_1"],
        "take_profit_2": entry["risk"]["take_profit_2"],
        "risk_reward": entry["risk"]["risk_reward"],
        "wave": {
            "status": wave["wave_status"],
            "current_wave": wave["current_wave"],
            "confidence": wave["confidence"],
            "waves": wave["waves"],
            "correction": wave["correction"],
            "next_projection": wave["next_projection"],
        },
        "fibonacci_levels": fib["retracements"],
        "support": [item["price"] for item in structure if item["type"] == "low"][-3:],
        "resistance": [item["price"] for item in structure if item["type"] == "high"][-3:],
        "prediction_line": _prediction_line(candles, entry["signal"], entry["risk"]),
        "scenario": entry["scenario"],
        "reason": entry["reason"],
        "time_cycle": time_cycle,
        "indicators": indicators,
        "candles": candles,
    }


def _prediction_line(candles: list[dict], signal: str, risk: dict) -> list[dict]:
    last = candles[-1]
    target = risk["take_profit_1"] if signal in {"LONG", "SHORT"} else last["close"]
    steps = 3
    line = [{"time": candles[-1]["time"], "price": last["close"]}]
    for index in range(1, steps + 1):
        line.append({"time": f"+{index} candle", "price": round(last["close"] + (target - last["close"]) * index / steps, 4)})
    return line
