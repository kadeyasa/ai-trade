from __future__ import annotations

from fastapi import FastAPI

from api.prediction_routes import router as prediction_router

app = FastAPI(title="AI Trading Prediction API", version="1.0.0")
app.include_router(prediction_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
