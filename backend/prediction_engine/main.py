import hashlib
import json

from fastapi import FastAPI

from engine import predict
from models import PredictionRequest, TradingPrediction
from storage import cache_get, cache_set, store_prediction

app = FastAPI(title="Trading Prediction Engine", version="0.1.0")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/predict", response_model=TradingPrediction)
async def create_prediction(request: PredictionRequest) -> TradingPrediction:
    body = request.model_dump()
    cache_key = "prediction:" + hashlib.sha256(json.dumps(body, sort_keys=True).encode()).hexdigest()
    cached = await cache_get(cache_key)
    if cached:
        return TradingPrediction.model_validate(cached)

    prediction = predict(request.symbol, request.timeframe, request.candles)
    payload = prediction.model_dump()
    await cache_set(cache_key, payload)
    await store_prediction(payload)
    return prediction
