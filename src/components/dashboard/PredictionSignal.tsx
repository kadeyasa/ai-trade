import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { pct } from "@/lib/utils";
import type { PredictionSnapshotView } from "@/types/prediction";

export function PredictionSignal({ prediction }: { prediction: PredictionSnapshotView }) {
  const tone = prediction.signal === "BULLISH" ? "green" : prediction.signal === "BEARISH" || prediction.signal === "HIGH_RISK" ? "red" : "yellow";
  const rows = [
    ["Bullish", prediction.bullishProbability],
    ["Bearish", prediction.bearishProbability],
    ["Sideways", prediction.sidewaysProbability]
  ] as const;

  return (
    <Card id="prediction">
      <CardHeader title="Prediction Signal Engine" action={<Badge tone={tone}>{prediction.signal}</Badge>} />
      <div className="space-y-4">
        {rows.map(([label, value]) => (
          <div key={label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-medium text-slate-700">{label}</span>
              <span className="text-slate-500">{pct(value)}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-mint" style={{ width: pct(value) }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-md bg-slate-50 p-4">
        <div className="text-sm font-medium text-ink">Confidence {pct(prediction.confidence)}</div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
          {prediction.reasons.slice(0, 5).map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
