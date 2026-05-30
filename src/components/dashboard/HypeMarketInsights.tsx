import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { LoadingLink } from "@/components/layout/NavigationLoadingProvider";
import { formatCompact, formatUsd, pct } from "@/lib/utils";
import type { HypeMarketInsight } from "@/types/insight";

export function HypeMarketInsights({ insight }: { insight: HypeMarketInsight }) {
  return (
    <Card>
      <CardHeader title="Hype Market Watchlist" action={<Badge tone="blue">{insight.source}</Badge>} />
      <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
        Watchlist ini adalah sinyal probabilistik untuk memantau setup LONG, bukan saran finansial dan bukan instruksi pembelian.
        Sistem menganalisa {insight.analyzedCount.toLocaleString()} coin dari market data.
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {insight.candidates.map((coin, index) => (
          <article key={coin.id} className="rounded-md border border-slate-200 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-3">
                {coin.image ? <Image src={coin.image} alt="" width={36} height={36} className="rounded-full" /> : null}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-500">#{index + 1}</span>
                    <h3 className="text-base font-semibold text-ink">{coin.name}</h3>
                    <Badge>{coin.symbol}</Badge>
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Rank #{coin.rank ?? "-"} · {formatUsd(coin.priceUsd)} · Vol {formatCompact(coin.volume24h)}
                  </div>
                </div>
              </div>
              <Badge tone={coin.signal === "STRONG_WATCH" ? "green" : coin.signal === "HIGH_RISK" ? "red" : "yellow"}>
                {coin.signal}
              </Badge>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <MiniMetric label="Long setup" value={pct(coin.longSetupScore)} />
              <MiniMetric label="Hype" value={pct(coin.hypeScore)} />
              <MiniMetric label="Risk" value={pct(coin.riskScore)} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <ScoreBar label="Teknikal" value={coin.technicalScore} />
              <ScoreBar label="Sentiment" value={coin.sentimentScore} />
              <ScoreBar label="News/Catalyst" value={coin.newsCatalystScore} />
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <ReasonBlock title="Teknikal" items={coin.technicalReasons} />
              <ReasonBlock title="Market Drivers" items={[coin.sentimentReasons[0], coin.newsReasons[0], coin.riskReasons[0]]} />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span>1h {formatChange(coin.priceChange1h)}</span>
              <span>24h {formatChange(coin.priceChange24h)}</span>
              <span>7d {formatChange(coin.priceChange7d)}</span>
              <LoadingLink href={`/dashboard?coinId=${coin.id}`} className="ml-auto rounded-md bg-ink px-3 py-2 text-sm font-medium text-white hover:bg-slate-700">
                Detail analisa
              </LoadingLink>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-4 rounded-md bg-slate-50 p-4">
        <div className="text-sm font-semibold text-ink">Metodologi</div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
          {insight.methodology.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
    </Card>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-ink">{value}</div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span>{pct(value)}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-mint" style={{ width: pct(value) }} />
      </div>
    </div>
  );
}

function ReasonBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</div>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
        {items.filter(Boolean).map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

function formatChange(value?: number | null) {
  if (value == null) return "-";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}
