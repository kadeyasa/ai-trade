from __future__ import annotations

import urllib.parse
import urllib.request
import json


BINANCE_REST_URL = "https://api.binance.com/api/v3/klines"
SUPPORTED_TIMEFRAMES = {"15m", "1h", "4h", "1d"}


def normalize_symbol(symbol: str) -> str:
    clean = "".join(ch for ch in symbol.upper() if ch.isalnum())
    return clean if clean.endswith("USDT") else f"{clean}USDT"


def normalize_timeframe(timeframe: str) -> str:
    return timeframe if timeframe in SUPPORTED_TIMEFRAMES else "1h"


def fetch_ohlcv(symbol: str, timeframe: str, limit: int = 240) -> list[dict]:
    params = urllib.parse.urlencode(
        {
            "symbol": normalize_symbol(symbol),
            "interval": normalize_timeframe(timeframe),
            "limit": max(20, min(int(limit), 1000)),
        }
    )
    with urllib.request.urlopen(f"{BINANCE_REST_URL}?{params}", timeout=12) as response:
        rows = json.loads(response.read().decode("utf-8"))

    return [
        {
            "time": row[0],
            "open": float(row[1]),
            "high": float(row[2]),
            "low": float(row[3]),
            "close": float(row[4]),
            "volume": float(row[5]),
        }
        for row in rows
    ]
