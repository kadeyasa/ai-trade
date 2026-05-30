import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatBox } from "@/components/ui/StatBox";
import { formatUsd } from "@/lib/utils";
import type { EntryInsight } from "@/types/entry";

export function EntryInsightPanel({ insight }: { insight: EntryInsight }) {
  const tone = insight.setupQuality === "KUAT" ? "green" : insight.setupQuality === "BERISIKO" ? "red" : "yellow";

  return (
    <Card>
      <CardHeader title="Zona Harga Pantauan LONG" action={<Badge tone={tone}>{insight.setupQuality}</Badge>} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatBox label="Harga Saat Ini" value={formatUsd(insight.currentPrice)} detail="CoinGecko market price" />
        <StatBox
          label="Zona Pullback"
          value={`${formatUsd(insight.pullbackZoneLow)} - ${formatUsd(insight.pullbackZoneHigh)}`}
          detail="Area observasi entry bertahap"
        />
        <StatBox label="Breakout Trigger" value={formatUsd(insight.breakoutTrigger)} detail="Butuh konfirmasi volume" />
        <StatBox label="Invalidation" value={formatUsd(insight.invalidationPrice)} detail="Level batal skenario LONG" />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Target Observasi 1</div>
          <div className="mt-2 text-xl font-semibold text-ink">{formatUsd(insight.targetObservation1)}</div>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Target Observasi 2</div>
          <div className="mt-2 text-xl font-semibold text-ink">{formatUsd(insight.targetObservation2)}</div>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Risk/Reward Proxy</div>
          <div className="mt-2 text-xl font-semibold text-ink">{insight.riskRewardProxy}R</div>
        </div>
      </div>
      <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
        Zona ini adalah level pantauan probabilistik, bukan instruksi beli. Konfirmasi tetap perlu memakai volume, candle close, dan toleransi risiko pribadi.
      </div>
      <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-600">
        {insight.reasons.map((reason) => <li key={reason}>{reason}</li>)}
      </ul>
    </Card>
  );
}
