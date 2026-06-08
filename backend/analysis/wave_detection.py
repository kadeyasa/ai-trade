from __future__ import annotations


def _wave_point(label: str, point: dict) -> dict:
    return {"label": label, "time": point["time"], "price": point["price"], "index": point["index"], "type": point["type"]}


def _ratio(value: float, base: float) -> float | None:
    return round(value / base, 3) if base else None


def detect_waves(swings: list[dict], latest_price: float) -> dict:
    fallback = {
        "wave_status": "unclear",
        "current_wave": "unclear",
        "confidence": 0,
        "waves": [],
        "correction": [],
        "validation": {
            "wave_2_retracement": False,
            "wave_3_not_shortest": False,
            "wave_3_extension": False,
            "wave_4_retracement": False,
            "wave_4_no_overlap": False,
            "wave_5_target": False,
        },
        "next_projection": {"target_wave": None, "price_zone": [], "time_zone": "wait confirmation"},
        "message": "Wave unclear / Wait confirmation",
    }
    if len(swings) < 3:
        return fallback

    best = fallback
    for start in range(max(0, len(swings) - 14), max(0, len(swings) - 5) + 1):
        points = swings[start : start + 6]
        if len(points) < 6:
            continue
        pattern = "-".join(point["type"] for point in points)
        bullish = pattern == "low-high-low-high-low-high"
        bearish = pattern == "high-low-high-low-high-low"
        if not bullish and not bearish:
            continue

        signed = (lambda a, b: b - a) if bullish else (lambda a, b: a - b)
        w1 = signed(points[0]["price"], points[1]["price"])
        w2 = signed(points[2]["price"], points[1]["price"])
        w3 = signed(points[2]["price"], points[3]["price"])
        w4 = signed(points[4]["price"], points[3]["price"])
        w5 = signed(points[4]["price"], points[5]["price"])
        if min(w1, w2, w3, w4, w5) <= 0:
            continue

        wave2 = _ratio(w2, w1)
        wave3 = _ratio(w3, w1)
        wave4 = _ratio(w4, w3)
        wave5_w1 = _ratio(w5, w1)
        wave5_w3 = _ratio(w5, w3)
        validation = {
            "wave_2_retracement": wave2 is not None and 0.382 <= wave2 <= 0.786,
            "wave_3_not_shortest": w3 >= min(w1, w5),
            "wave_3_extension": wave3 is not None and wave3 >= 1.35,
            "wave_4_retracement": wave4 is not None and 0.236 <= wave4 <= 0.5,
            "wave_4_no_overlap": points[4]["price"] > points[1]["price"] if bullish else points[4]["price"] < points[1]["price"],
            "wave_5_target": (wave5_w1 is not None and 0.618 <= wave5_w1 <= 1.0) or (wave5_w3 is not None and 0.618 <= wave5_w3 <= 1.0),
        }
        confidence = min(100, sum(14 for valid in validation.values() if valid) + 10)
        status = "bullish_impulse" if bullish else "bearish_impulse"
        wave5_done = latest_price < points[5]["price"] if bullish else latest_price > points[5]["price"]
        correction_points = swings[start + 6 : start + 9]
        correction = []
        if len(correction_points) == 3:
            expected = "low-high-low" if bullish else "high-low-high"
            if "-".join(point["type"] for point in correction_points) == expected:
                correction = [_wave_point(label, point) for label, point in zip(["A", "B", "C"], correction_points)]
                confidence = min(100, confidence + 12)
        current_wave = "wave_5_complete" if wave5_done else "wave_5_in_progress"
        candidate = {
            "wave_status": status,
            "current_wave": "abc_correction" if correction else current_wave,
            "confidence": confidence,
            "waves": [_wave_point(str(index + 1), point) for index, point in enumerate(points)],
            "correction": correction,
            "validation": validation,
            "ratios": {"wave2": wave2, "wave3": wave3, "wave4": wave4, "wave5_w1": wave5_w1, "wave5_w3": wave5_w3},
            "next_projection": {
                "target_wave": "5" if not wave5_done else "A-B-C",
                "price_zone": _target_zone(points, bullish, w1, w3),
                "time_zone": "next 13-21 candles",
            },
            "message": f"{status.replace('_', ' ')} detected",
        }
        if candidate["confidence"] >= best["confidence"]:
            best = candidate

    partial = _detect_partial_wave(swings)
    return partial if partial["confidence"] > best["confidence"] else best


def _target_zone(points: list[dict], bullish: bool, w1: float, w3: float) -> list[float]:
    base = points[4]["price"]
    low_extension = min(w1, w3) * 0.618
    high_extension = max(w1, w3)
    if bullish:
        return [round(base + low_extension, 4), round(base + high_extension, 4)]
    return [round(base - high_extension, 4), round(base - low_extension, 4)]


def _detect_partial_wave(swings: list[dict]) -> dict:
    last5 = swings[-5:]
    if len(last5) < 3:
        confidence = 0
        return {"wave_status": "unclear", "current_wave": "unclear", "confidence": confidence, "waves": [], "correction": [], "validation": {}, "next_projection": {}, "message": "Wave unclear / Wait confirmation"}
    pattern3 = "-".join(point["type"] for point in last5[-3:])
    bullish2 = pattern3 == "low-high-low"
    bearish2 = pattern3 == "high-low-high"
    if bullish2 or bearish2:
        points = last5[-3:]
        w1 = abs(points[1]["price"] - points[0]["price"])
        w2 = abs(points[1]["price"] - points[2]["price"])
        retracement = _ratio(w2, w1)
        valid = retracement is not None and 0.382 <= retracement <= 0.786
        direction = "bullish" if bullish2 else "bearish"
        return {
            "wave_status": f"{direction}_partial",
            "current_wave": "wave_2_correction",
            "confidence": 55 if valid else 25,
            "waves": [_wave_point("1", points[1]), _wave_point("2", points[2])],
            "correction": [],
            "validation": {"wave_2_retracement": valid},
            "ratios": {"wave2": retracement},
            "next_projection": {"target_wave": "3", "price_zone": [], "time_zone": "next 13-21 candles"},
            "message": f"{direction} wave 2 correction detected" if valid else "Wave unclear / Wait confirmation",
        }
    return {"wave_status": "unclear", "current_wave": "unclear", "confidence": 0, "waves": [], "correction": [], "validation": {}, "next_projection": {}, "message": "Wave unclear / Wait confirmation"}
