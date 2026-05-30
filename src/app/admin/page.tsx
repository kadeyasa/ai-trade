import { KeyRound, RefreshCw, Settings2 } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { Table, Td, Th } from "@/components/ui/Table";
import { tokenConfig } from "@/config/token";
import { canPersistAdminSettings, getAdminSettings, getCoinGeckoApiKey, getCronSecret, getOpenAIKey, getXBearerToken, maskSecret } from "@/lib/admin-settings";
import { hasSecret, isMockMode } from "@/lib/env";
import { saveSettingsAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  const settings = getAdminSettings();
  const openaiKey = getOpenAIKey();
  const xBearerToken = getXBearerToken();
  const coingeckoApiKey = getCoinGeckoApiKey();
  const cronSecret = getCronSecret();
  const canPersistSettings = canPersistAdminSettings();
  const providers = [
    ["DEX Screener", "No key required", true],
    ["CoinGecko", maskSecret(coingeckoApiKey), hasSecret(coingeckoApiKey)],
    ["X API", maskSecret(xBearerToken), hasSecret(xBearerToken)],
    ["OpenAI", maskSecret(openaiKey), hasSecret(openaiKey)],
    ["Collector Guard", maskSecret(cronSecret), hasSecret(cronSecret)]
  ] as const;

  return (
    <PageContainer>
      <div className="space-y-6">
        <Card>
          <CardHeader title="Admin Settings" action={<Badge tone={isMockMode() ? "yellow" : "green"}>{isMockMode() ? "Mode cadangan" : "Live mode"}</Badge>} />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-md border border-slate-200 p-4">
              <Settings2 className="h-5 w-5 text-slate-500" />
              <div className="mt-3 text-sm font-semibold text-ink">Token</div>
              <p className="mt-1 text-sm text-slate-600">{tokenConfig.name} on {tokenConfig.chain}</p>
            </div>
            <div className="rounded-md border border-slate-200 p-4">
              <KeyRound className="h-5 w-5 text-slate-500" />
              <div className="mt-3 text-sm font-semibold text-ink">Secrets</div>
              <p className="mt-1 text-sm text-slate-600">Jika key belum tersedia, sistem memakai data cadangan atau heuristic.</p>
            </div>
            <div className="rounded-md border border-slate-200 p-4">
              <RefreshCw className="h-5 w-5 text-slate-500" />
              <div className="mt-3 text-sm font-semibold text-ink">Collectors</div>
              <p className="mt-1 text-sm text-slate-600">Cron can call `/api/collect/market`, `/social`, and `/news`.</p>
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title="API Key dan Limit Analisa" />
          <form action={saveSettingsAction} className="grid gap-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                OpenAI API Key
                <input
                  name="openaiApiKey"
                  type="password"
                  placeholder={maskSecret(openaiKey)}
                  disabled={!canPersistSettings}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                X Bearer Token
                <input
                  name="xBearerToken"
                  type="password"
                  placeholder={maskSecret(xBearerToken)}
                  disabled={!canPersistSettings}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                CoinGecko API Key
                <input
                  name="coingeckoApiKey"
                  type="password"
                  placeholder={maskSecret(coingeckoApiKey)}
                  disabled={!canPersistSettings}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Cron Secret
                <input
                  name="cronSecret"
                  type="password"
                  placeholder={maskSecret(cronSecret)}
                  disabled={!canPersistSettings}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Jumlah Tweet/Post Dianalisa
                <input
                  name="socialAnalysisLimit"
                  type="number"
                  min="10"
                  max="100"
                  defaultValue={settings.socialAnalysisLimit}
                  disabled={!canPersistSettings}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Jumlah News Dianalisa
                <input
                  name="newsAnalysisLimit"
                  type="number"
                  min="10"
                  max="100"
                  defaultValue={settings.newsAnalysisLimit}
                  disabled={!canPersistSettings}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-slate-50 p-4">
              <p className="text-sm text-slate-600">
                {canPersistSettings
                  ? "Field key boleh dikosongkan jika tidak ingin mengubah key yang sudah tersimpan. Limit dipakai untuk X API/GDELT dan data cadangan."
                  : "Di Vercel, ubah key dan limit dari Project Settings > Environment Variables agar aman dan persistent."}
              </p>
              <button type="submit" disabled={!canPersistSettings} className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                Simpan Settings
              </button>
            </div>
          </form>
        </Card>
        <Card>
          <CardHeader title="Provider Status" />
          <Table>
            <thead>
              <tr>
                <Th>Provider</Th>
                <Th>Setting</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {providers.map(([provider, variable, ready]) => (
                <tr key={provider}>
                  <Td>{provider}</Td>
                  <Td>{variable}</Td>
                  <Td><Badge tone={ready ? "green" : "yellow"}>{ready ? "configured" : "cadangan"}</Badge></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
    </PageContainer>
  );
}
