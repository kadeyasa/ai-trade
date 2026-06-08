from __future__ import annotations


WEIGHTS = {
    "trend_structure": 25,
    "fibonacci_zone": 20,
    "wave_count": 20,
    "volume_confirmation": 15,
    "momentum": 10,
    "time_cycle": 10,
}


def score_setup(factors: dict) -> dict:
    score = sum(weight for key, weight in WEIGHTS.items() if factors.get(key))
    if score <= 50:
        label = "NO TRADE"
    elif score <= 70:
        label = "WEAK SETUP"
    elif score <= 85:
        label = "GOOD SETUP"
    else:
        label = "HIGH PROBABILITY SETUP"
    return {"score": score, "label": label}
