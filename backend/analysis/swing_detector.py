from __future__ import annotations


def detect_swings(candles: list[dict], pivot_window: int = 3) -> list[dict]:
    swings: list[dict] = []
    for index in range(pivot_window, len(candles) - pivot_window):
        window = candles[index - pivot_window : index + pivot_window + 1]
        candle = candles[index]
        if candle["high"] == max(item["high"] for item in window):
            swings.append({"type": "high", "time": candle["time"], "price": candle["high"], "index": index})
        if candle["low"] == min(item["low"] for item in window):
            swings.append({"type": "low", "time": candle["time"], "price": candle["low"], "index": index})
    return simplify_swings(swings)


def simplify_swings(swings: list[dict]) -> list[dict]:
    simplified: list[dict] = []
    for swing in swings:
        previous = simplified[-1] if simplified else None
        if not previous or previous["type"] != swing["type"]:
            simplified.append(swing)
            continue
        more_extreme = swing["price"] > previous["price"] if swing["type"] == "high" else swing["price"] < previous["price"]
        if more_extreme:
            simplified[-1] = swing
    return simplified


def classify_market_structure(swings: list[dict]) -> list[dict]:
    last_high = None
    last_low = None
    output: list[dict] = []
    for swing in swings:
        if swing["type"] == "high":
            label = "HH" if last_high is None or swing["price"] > last_high else "LH"
            last_high = swing["price"]
        else:
            label = "HL" if last_low is None or swing["price"] > last_low else "LL"
            last_low = swing["price"]
        output.append({**swing, "structure": label})
    return output


def structure_bias(structure: list[dict]) -> str:
    labels = [item["structure"] for item in structure[-6:]]
    if labels.count("HH") >= 1 and labels.count("HL") >= 1:
        return "bullish"
    if labels.count("LH") >= 1 and labels.count("LL") >= 1:
        return "bearish"
    return "neutral"
