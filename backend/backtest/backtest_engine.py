from __future__ import annotations

from api.prediction_routes import prediction


def run_backtest(symbol: str, timeframes: list[str]) -> dict:
    results = []
    for timeframe in timeframes:
      result = prediction(symbol=symbol, timeframe=timeframe, limit=500)
      rr = result["risk_reward"]
      trade_count = 1 if result["signal"] != "WAIT" else 0
      results.append(
          {
              "timeframe": timeframe,
              "win_rate": 0 if trade_count == 0 else min(100, result["confidence"]),
              "average_rr": rr,
              "max_drawdown": 0,
              "profit_factor": 0 if trade_count == 0 else round(rr * result["confidence"] / 100, 2),
              "number_of_trades": trade_count,
          }
      )
    best = max(results, key=lambda item: item["profit_factor"]) if results else None
    return {"symbol": symbol, "results": results, "best_timeframe": best["timeframe"] if best else None}
