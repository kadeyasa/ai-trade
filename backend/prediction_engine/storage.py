import json
import os
from uuid import uuid4

import asyncpg
import redis.asyncio as redis

DATABASE_URL = os.getenv("DATABASE_URL")
REDIS_URL = os.getenv("REDIS_URL")


async def cache_get(key: str) -> dict | None:
    if not REDIS_URL:
        return None
    client = redis.from_url(REDIS_URL, decode_responses=True)
    try:
        cached = await client.get(key)
        return json.loads(cached) if cached else None
    finally:
        await client.aclose()


async def cache_set(key: str, payload: dict, ttl_seconds: int = 60) -> None:
    if not REDIS_URL:
        return
    client = redis.from_url(REDIS_URL, decode_responses=True)
    try:
        await client.setex(key, ttl_seconds, json.dumps(payload))
    finally:
        await client.aclose()


async def store_prediction(payload: dict) -> None:
    if not DATABASE_URL:
        return
    connection = await asyncpg.connect(DATABASE_URL)
    try:
        await connection.execute(
            """
            INSERT INTO "TradingAnalysis"
              ("id", "symbol", "timeframe", "signal", "scenario", "confidence", "entryPrice",
               "stopLoss", "takeProfit1", "takeProfit2", "riskRewardRatio", "analysisJson", "createdAt")
            VALUES
              ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, NOW())
            """,
            str(uuid4()),
            payload["symbol"],
            payload["timeframe"],
            payload["signal"],
            payload["scenario"],
            payload["confidence"],
            payload["risk"]["entryPrice"],
            payload["risk"]["stopLoss"],
            payload["risk"]["takeProfit1"],
            payload["risk"]["takeProfit2"],
            payload["risk"]["riskRewardRatio"],
            json.dumps(payload),
        )
    finally:
        await connection.close()
