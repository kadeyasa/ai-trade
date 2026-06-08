from __future__ import annotations


FIB_INTERVALS = [13, 21, 34, 55, 89]


def analyze_time_cycle(swings: list[dict], candle_count: int) -> dict:
    if len(swings) < 2:
        return {"nearest_reversal_window": "no cycle anchor", "cycle_confidence": 0, "intervals": []}
    distances = [abs(swings[index]["index"] - swings[index - 1]["index"]) for index in range(1, len(swings))]
    avg_distance = sum(distances[-5:]) / min(len(distances), 5)
    nearest = min(FIB_INTERVALS, key=lambda interval: abs(interval - avg_distance))
    confidence = max(0, min(100, int(100 - abs(nearest - avg_distance) / nearest * 100)))
    return {
        "nearest_reversal_window": f"next {nearest}-{FIB_INTERVALS[min(FIB_INTERVALS.index(nearest) + 1, len(FIB_INTERVALS) - 1)]} candles",
        "cycle_confidence": confidence,
        "intervals": FIB_INTERVALS,
        "next_indexes": [candle_count + interval for interval in FIB_INTERVALS],
    }
