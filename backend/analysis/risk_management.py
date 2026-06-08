from __future__ import annotations


def build_risk_plan(signal: str, price: float, atr: float, swings: list[dict], fib: dict) -> dict:
    atr = atr or price * 0.01
    lows = [swing["price"] for swing in swings if swing["type"] == "low"]
    highs = [swing["price"] for swing in swings if swing["type"] == "high"]
    if signal == "LONG":
        stop_loss = min(lows[-2:] or [price - atr]) - atr * 0.25
        take_profit_1 = max(highs[-2:] or [price + atr * 2])
        take_profit_2 = fib["extensions"].get("1.618") or price + atr * 4
    elif signal == "SHORT":
        stop_loss = max(highs[-2:] or [price + atr]) + atr * 0.25
        take_profit_1 = min(lows[-2:] or [price - atr * 2])
        take_profit_2 = fib["extensions"].get("1.618") or price - atr * 4
    else:
        stop_loss = price - atr
        take_profit_1 = price + atr * 2
        take_profit_2 = price + atr * 3
    risk = abs(price - stop_loss) or 1
    reward = abs(take_profit_2 - price)
    return {
        "entry": price,
        "stop_loss": round(stop_loss, 4),
        "take_profit_1": round(take_profit_1, 4),
        "take_profit_2": round(take_profit_2, 4),
        "risk_reward": round(reward / risk, 2),
        "valid_rr": reward / risk >= 2,
    }
