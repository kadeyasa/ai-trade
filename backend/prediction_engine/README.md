# Trading Prediction Engine

FastAPI service for the dashboard trading module.

```bash
cd backend/prediction_engine
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Optional environment variables:

- `DATABASE_URL` stores each generated analysis in PostgreSQL.
- `REDIS_URL` caches repeated prediction requests.

Point the Next.js dashboard at it with:

```bash
FASTAPI_PREDICTION_URL=http://localhost:8000
```
