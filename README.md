# Crypto Intelligence Dashboard

A Next.js App Router dashboard for monitoring one DEX-only cryptocurrency token with market trend, social sentiment, news analysis, probabilistic prediction signals, token health, and risk warnings.

This is not a trading bot. It does not execute automatic buy/sell actions and does not provide financial advice. All outputs are probabilistic intelligence signals.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- Recharts
- Server-side API routes
- Cron-compatible collector routes
- OpenAI API for sentiment and news analysis
- DEX Screener primary market data
- CoinGecko reserve market data
- X API for social tracking
- GDELT DOC API for news discovery

## Setup

```bash
cd crypto-intel-dashboard
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Open `http://localhost:3000/dashboard`.

## Deploy to Vercel

1. Push/import this repository into Vercel.
2. Framework preset: `Next.js`.
3. Install command: `npm install`.
4. Build command: `npm run build`.
5. Output directory: leave empty/default.
6. Add environment variables in Vercel Project Settings.
7. If `MOCK_DATA_MODE=false`, run the Prisma migration against your production PostgreSQL database before using live collectors:

```bash
npx prisma migrate deploy
```

The app includes `vercel.json` with one daily cron job on `/api/collect/all`, which is compatible with Vercel Hobby plan limits. The existing individual collector routes can still be called manually:

- `/api/collect/market`
- `/api/collect/social`
- `/api/collect/news`

On Vercel, admin settings are read from Environment Variables instead of `data/admin-settings.json`, because serverless filesystem writes are not persistent.

## Environment Variables

`MOCK_DATA_MODE=true` makes the app use reserve/sample data. If an API key is missing, connectors use reserve data or heuristic analysis instead of failing.

Important variables:

- `DATABASE_URL`
- `MOCK_DATA_MODE`
- `TOKEN_NAME`
- `TOKEN_SYMBOL`
- `TOKEN_CHAIN`
- `TOKEN_CONTRACT_ADDRESS`
- `TOKEN_PAIR_ADDRESS`
- `TOKEN_DEX_NAME`
- `OPENAI_API_KEY`
- `X_BEARER_TOKEN`
- `COINGECKO_API_KEY`
- `CRON_SECRET`
- `SOCIAL_ANALYSIS_LIMIT`
- `NEWS_ANALYSIS_LIMIT`

Recommended Vercel starter values:

```bash
MOCK_DATA_MODE=true
APP_BASE_URL=https://your-vercel-domain.vercel.app
SOCIAL_ANALYSIS_LIMIT=25
NEWS_ANALYSIS_LIMIT=25
CRON_SECRET=use-a-random-string-at-least-16-chars
```

## API Routes

- `GET /api/market`
- `GET /api/social`
- `GET /api/news`
- `POST /api/analyze`
- `GET /api/predict`
- `POST /api/predict`

Cron-compatible collectors:

- `GET /api/collect/market`
- `GET /api/collect/social`
- `GET /api/collect/news`

If `CRON_SECRET` is set, call collectors with:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/collect/market
```

## Scoring Formula

Token Signal Score:

- 30% Market Momentum
- 25% Social Sentiment
- 20% News Impact
- 15% Liquidity Health
- 10% Risk Adjustment

Outputs:

- bullish probability
- bearish probability
- sideways probability
- confidence
- signal: `BULLISH`, `BEARISH`, `SIDEWAYS`, `HIGH_RISK`
- risk level: `LOW`, `MEDIUM`, `HIGH`, `EXTREME`
- human-readable reasons

## Tests

```bash
npm test
```

The MVP test coverage focuses on scoring normalization, market momentum behavior, and liquidity risk behavior.
