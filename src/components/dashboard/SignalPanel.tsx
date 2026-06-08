import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatBox } from "@/components/ui/StatBox";
import { formatUsd } from "@/lib/utils";
import type { TradingPrediction } from "@/types/trading-prediction";

function signalTone(signal: TradingPrediction["signal"]) {
  if (signal === "STRONG_LONG" || signal === "LONG") return "green";
  if (signal === "STRONG_SHORT" || signal === "SHORT") return "red";
  return "yellow";
}

function signalText(signal: TradingPrediction["signal"]) {
  return signal.replace("_", " ");
}

export function SignalPanel({ prediction }: { prediction: TradingPrediction }) {
  const wave = prediction.waveAnalysis;
  const setupType =
    prediction.signal === "WAIT"
      ? "NO TRADE"
      : `${wave.currentPhase.replaceAll("_", " ").toLowerCase()} ${prediction.preferredDirection.toLowerCase()}`;

  return (
    <Card>
      <CardHeader
        title="AI Trading Signal"
        action={
          <div className="flex items-center gap-2">
            <a
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-300"
              href="#trading-signal-chart"
            >
              View Chart
            </a>
            <Badge tone={signalTone(prediction.signal)}>{signalText(prediction.signal)}</Badge>
            <Badge tone="blue">{prediction.confidence}% confidence</Badge>
          </div>
        }
      />
      <div className="grid gap-3 lg:grid-cols-5">
        <StatBox label="Current Wave" value={wave.currentPhase.replaceAll("_", " ")} detail={wave.message} />
        <StatBox label="Setup Type" value={setupType.toUpperCase()} detail={wave.status === "UNCLEAR" ? "Wait confirmation" : `${wave.confidence}% wave confidence`} />
        <StatBox label="Entry" value={formatUsd(prediction.risk.entryPrice)} detail={`${prediction.preferredDirection} setup`} />
        <StatBox label="Stop Loss" value={formatUsd(prediction.risk.stopLoss)} detail="Invalidation level" />
        <StatBox label="TP1 / TP2" value={`${formatUsd(prediction.risk.takeProfit1)} / ${formatUsd(prediction.risk.takeProfit2)}`} detail={`${prediction.risk.riskRewardRatio}R`} />
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Scenario Bias</div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-md bg-white p-3">
              <div className="text-slate-500">Long</div>
              <div className="mt-1 text-lg font-semibold text-emerald-700">{prediction.longScore}/7</div>
            </div>
            <div className="rounded-md bg-white p-3">
              <div className="text-slate-500">Neutral</div>
              <div className="mt-1 text-lg font-semibold text-slate-700">{prediction.signal === "WAIT" ? "Active" : "Low"}</div>
            </div>
            <div className="rounded-md bg-white p-3">
              <div className="text-slate-500">Short</div>
              <div className="mt-1 text-lg font-semibold text-red-700">{prediction.shortScore}/7</div>
            </div>
          </div>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Reason</div>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
            {prediction.confluence.map((item) => (
              <li key={item.name}>
                <span className="font-medium text-ink">{item.name}:</span> {item.note}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
