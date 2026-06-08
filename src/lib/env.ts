import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  APP_BASE_URL: z.string().default("http://localhost:3000"),
  MOCK_DATA_MODE: z.string().default("true"),
  TOKEN_NAME: z.string().default("Crypto Intelligence"),
  TOKEN_SYMBOL: z.string().default("MARKET"),
  TOKEN_CHAIN: z.string().default("multi-chain"),
  TOKEN_CONTRACT_ADDRESS: z.string().default("0x0000000000000000000000000000000000000000"),
  TOKEN_PAIR_ADDRESS: z.string().optional().default(""),
  TOKEN_DEX_NAME: z.string().default("PancakeSwap"),
  TOKEN_OPEN_PRICE_IDR: z.string().default("1000"),
  OPENAI_API_KEY: z.string().optional(),
  X_BEARER_TOKEN: z.string().optional(),
  COINGECKO_API_KEY: z.string().optional(),
  FASTAPI_PREDICTION_URL: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  SOCIAL_ANALYSIS_LIMIT: z.string().optional(),
  NEWS_ANALYSIS_LIMIT: z.string().optional(),
  VERCEL: z.string().optional()
});

export const env = envSchema.parse(process.env);

export function isMockMode() {
  return env.MOCK_DATA_MODE === "true";
}

export function hasSecret(value?: string) {
  return Boolean(value && value.trim().length > 0);
}

export function envInt(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

export function isVercelRuntime() {
  return env.VERCEL === "1";
}
