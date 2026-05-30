import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { env, envInt, hasSecret, isVercelRuntime } from "@/lib/env";

const settingsPath = path.join(process.cwd(), "data", "admin-settings.json");

const settingsSchema = z.object({
  openaiApiKey: z.string().optional().default(""),
  xBearerToken: z.string().optional().default(""),
  coingeckoApiKey: z.string().optional().default(""),
  cronSecret: z.string().optional().default(""),
  socialAnalysisLimit: z.number().int().min(10).max(100).default(25),
  newsAnalysisLimit: z.number().int().min(10).max(100).default(25)
});

export type AdminSettings = z.infer<typeof settingsSchema>;

const envSettings: AdminSettings = {
  openaiApiKey: env.OPENAI_API_KEY ?? "",
  xBearerToken: env.X_BEARER_TOKEN ?? "",
  coingeckoApiKey: env.COINGECKO_API_KEY ?? "",
  cronSecret: env.CRON_SECRET ?? "",
  socialAnalysisLimit: envInt(env.SOCIAL_ANALYSIS_LIMIT, 25, 10, 100),
  newsAnalysisLimit: envInt(env.NEWS_ANALYSIS_LIMIT, 25, 10, 100)
};

function readRawSettings(): Record<string, unknown> {
  try {
    if (!fs.existsSync(settingsPath)) return {};
    const parsed = JSON.parse(fs.readFileSync(settingsPath, "utf8")) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function getAdminSettings(): AdminSettings {
  if (isVercelRuntime()) return envSettings;
  return settingsSchema.parse({
    ...envSettings,
    ...readRawSettings()
  });
}

export function saveAdminSettings(input: Partial<AdminSettings>) {
  if (isVercelRuntime()) {
    return envSettings;
  }

  const current = getAdminSettings();
  const next = settingsSchema.parse({
    ...current,
    ...input,
    socialAnalysisLimit: Number(input.socialAnalysisLimit ?? current.socialAnalysisLimit),
    newsAnalysisLimit: Number(input.newsAnalysisLimit ?? current.newsAnalysisLimit)
  });
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(next, null, 2));
  return next;
}

export function getOpenAIKey() {
  const settings = getAdminSettings();
  return hasSecret(settings.openaiApiKey) ? settings.openaiApiKey : env.OPENAI_API_KEY;
}

export function getXBearerToken() {
  const settings = getAdminSettings();
  return hasSecret(settings.xBearerToken) ? settings.xBearerToken : env.X_BEARER_TOKEN;
}

export function getCoinGeckoApiKey() {
  const settings = getAdminSettings();
  return hasSecret(settings.coingeckoApiKey) ? settings.coingeckoApiKey : env.COINGECKO_API_KEY;
}

export function getCronSecret() {
  const settings = getAdminSettings();
  return hasSecret(settings.cronSecret) ? settings.cronSecret : env.CRON_SECRET;
}

export function maskSecret(value?: string) {
  if (!hasSecret(value)) return "belum diset";
  const visible = value?.slice(-4) ?? "";
  return `tersimpan ••••${visible}`;
}

export function canPersistAdminSettings() {
  return !isVercelRuntime();
}
