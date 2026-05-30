import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { pct } from "@/lib/utils";
import type { PredictionSnapshotView } from "@/types/prediction";

export function RiskScoreCard({ prediction }: { prediction: PredictionSnapshotView }) {
  const tone = prediction.riskLevel === "LOW" ? "green" : prediction.riskLevel === "MEDIUM" ? "yellow" : "red";
  return (
    <Card id="risk">
      <CardHeader title="Risk Warning" action={<Badge tone={tone}>{prediction.riskLevel}</Badge>} />
      <div className="text-4xl font-semibold text-ink">{pct(prediction.riskScore)}</div>
      <div className="mt-3 h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-danger" style={{ width: pct(prediction.riskScore) }} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">Liquidity score: {pct(prediction.liquidityScore)}</div>
        <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">Sell pressure proxy: {pct(1 - prediction.whaleScore)}</div>
      </div>
    </Card>
  );
}
