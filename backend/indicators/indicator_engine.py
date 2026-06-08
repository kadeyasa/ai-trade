from __future__ import annotations

from statistics import mean, pstdev


def _ema(values: list[float], period: int) -> list[float | None]:
    output: list[float | None] = []
    multiplier = 2 / (period + 1)
    previous: float | None = None
    for index, value in enumerate(values):
        if index < period - 1:
            output.append(None)
            continue
        previous = mean(values[index - period + 1 : index + 1]) if previous is None else value * multiplier + previous * (1 - multiplier)
        output.append(previous)
    return output


def _sma(values: list[float], period: int) -> list[float | None]:
    return [None if index < period - 1 else mean(values[index - period + 1 : index + 1]) for index in range(len(values))]


def _rsi(closes: list[float], period: int = 14) -> list[float | None]:
    output: list[float | None] = [None] * len(closes)
    if len(closes) <= period:
        return output
    gains = 0.0
    losses = 0.0
    for index in range(1, period + 1):
        change = closes[index] - closes[index - 1]
        gains += max(change, 0)
        losses += max(-change, 0)
    avg_gain = gains / period
    avg_loss = losses / period
    output[period] = 100 if avg_loss == 0 else 100 - 100 / (1 + avg_gain / avg_loss)
    for index in range(period + 1, len(closes)):
        change = closes[index] - closes[index - 1]
        avg_gain = (avg_gain * (period - 1) + max(change, 0)) / period
        avg_loss = (avg_loss * (period - 1) + max(-change, 0)) / period
        output[index] = 100 if avg_loss == 0 else 100 - 100 / (1 + avg_gain / avg_loss)
    return output


def _atr(candles: list[dict], period: int = 14) -> list[float | None]:
    ranges: list[float] = []
    for index, candle in enumerate(candles):
        if index == 0:
            ranges.append(candle["high"] - candle["low"])
        else:
            previous_close = candles[index - 1]["close"]
            ranges.append(max(candle["high"] - candle["low"], abs(candle["high"] - previous_close), abs(candle["low"] - previous_close)))
    return _sma(ranges, period)


def calculate_indicators(candles: list[dict]) -> list[dict]:
    closes = [candle["close"] for candle in candles]
    volumes = [candle["volume"] for candle in candles]
    ema20 = _ema(closes, 20)
    ema50 = _ema(closes, 50)
    ema200 = _ema(closes, 200)
    ema12 = _ema(closes, 12)
    ema26 = _ema(closes, 26)
    macd = [(ema12[i] - ema26[i]) if ema12[i] is not None and ema26[i] is not None else None for i in range(len(closes))]
    macd_signal = _ema([value or 0 for value in macd], 9)
    rsi14 = _rsi(closes)
    atr14 = _atr(candles)
    volume_ma = _sma(volumes, 20)

    output: list[dict] = []
    for index, candle in enumerate(candles):
        window = closes[max(0, index - 19) : index + 1]
        bb_middle = mean(window) if index >= 19 else None
        bb_std = pstdev(window) if index >= 19 and len(window) > 1 else None
        signal = macd_signal[index] if macd[index] is not None else None
        output.append(
            {
                "time": candle["time"],
                "ema20": ema20[index],
                "ema50": ema50[index],
                "ema200": ema200[index],
                "rsi14": rsi14[index],
                "macd": macd[index],
                "macd_signal": signal,
                "macd_histogram": macd[index] - signal if macd[index] is not None and signal is not None else None,
                "atr": atr14[index],
                "volume_ma20": volume_ma[index],
                "bb_upper": bb_middle + bb_std * 2 if bb_middle is not None and bb_std is not None else None,
                "bb_middle": bb_middle,
                "bb_lower": bb_middle - bb_std * 2 if bb_middle is not None and bb_std is not None else None,
            }
        )
    return output
