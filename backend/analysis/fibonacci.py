from __future__ import annotations


RETRACEMENTS = [0.236, 0.382, 0.5, 0.618, 0.786]
EXTENSIONS = [1.272, 1.414, 1.618, 2.0]


def calculate_fibonacci(anchor_low: float, anchor_high: float, trend: str) -> dict:
    span = abs(anchor_high - anchor_low)
    if trend == "bearish":
        retracements = {str(level): anchor_low + span * level for level in RETRACEMENTS}
        extensions = {str(level): anchor_low - span * (level - 1) for level in EXTENSIONS}
    else:
        retracements = {str(level): anchor_high - span * level for level in RETRACEMENTS}
        extensions = {str(level): anchor_high + span * (level - 1) for level in EXTENSIONS}
    return {
        "retracements": retracements,
        "extensions": extensions,
        "golden_zone": [retracements["0.618"], retracements["0.5"]] if trend != "bearish" else [retracements["0.5"], retracements["0.618"]],
    }


def price_in_zone(price: float, zone: list[float], tolerance: float = 0.002) -> bool:
    low = min(zone)
    high = max(zone)
    padding = price * tolerance
    return low - padding <= price <= high + padding
