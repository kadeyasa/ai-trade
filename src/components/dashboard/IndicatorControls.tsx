"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { pct } from "@/lib/utils";
import type { PredictionSnapshotView, Signal } from "@/types/prediction";

export type SignalIndicator = {
  key: "market" | "social" | "news" | "liquidity" | "risk";
  label: string;
  weight: number;
  score: number;
  description: string;
  subIndicators: string[];
};

type IndicatorKey = SignalIndicator["key"];

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function calculateAdjustedPrediction(indicators: SignalIndicator[], enabledKeys: IndicatorKey[], riskScore: number) {
  const enabled = indicators.filter((indicator) => enabledKeys.includes(indicator.key));
  const activeWeight = enabled.reduce((sum, indicator) => sum + indicator.weight, 0);
  const signalScore = activeWeight
    ? clamp(enabled.reduce((sum, indicator) => sum + indicator.score * indicator.weight, 0) / activeWeight)
    : 0.5;

  const adjustedRisk = enabledKeys.includes("risk") ? riskScore : riskScore * 0.5;
  const bearishBase = clamp((1 - signalScore) * 0.68 + adjustedRisk * 0.32);
  const sidewaysBase = clamp(1 - Math.abs(signalScore - 0.5) * 1.9);
  const bullishBase = clamp(signalScore * (1 - adjustedRisk * 0.45));
  const total = Math.max(0.001, bullishBase + bearishBase + sidewaysBase * 0.55);

  const bullishProbability = bullishBase / total;
  const bearishProbability = bearishBase / total;
  const sidewaysProbability = (sidewaysBase * 0.55) / total;
  const confidence = clamp(
    Math.max(bullishProbability, bearishProbability, sidewaysProbability) * 0.65 +
      (1 - Math.abs(0.5 - signalScore)) * 0.2 +
      (1 - adjustedRisk) * 0.15
  );

  let signal: Signal = "SIDEWAYS";
  if (adjustedRisk > 0.78) signal = "HIGH_RISK";
  else if (bullishProbability > bearishProbability && bullishProbability > sidewaysProbability) signal = "BULLISH";
  else if (bearishProbability > bullishProbability && bearishProbability > sidewaysProbability) signal = "BEARISH";

  return {
    signalScore,
    adjustedRisk,
    bullishProbability,
    bearishProbability,
    sidewaysProbability,
    confidence,
    signal
  };
}

export function IndicatorControls({
  indicators,
  prediction
}: {
  indicators: SignalIndicator[];
  prediction: PredictionSnapshotView;
}) {
  const [enabledKeys, setEnabledKeys] = useState(indicators.map((indicator) => indicator.key));
  const adjusted = useMemo(
    () => calculateAdjustedPrediction(indicators, enabledKeys, prediction.riskScore),
    [enabledKeys, indicators, prediction.riskScore]
  );
  const signalTone = adjusted.signal === "BULLISH" ? "green" : adjusted.signal === "BEARISH" || adjusted.signal === "HIGH_RISK" ? "red" : "yellow";

  function toggleIndicator(key: IndicatorKey) {
    setEnabledKeys((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    );
  }

  return (
    <Card id="indicators">
      <CardHeader title="Indikator Signal Engine" action={<Badge tone={signalTone}>{adjusted.signal}</Badge>} />
      <div className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <div className="space-y-3">
          {indicators.map((indicator) => {
            const enabled = enabledKeys.includes(indicator.key);
            return (
              <div key={indicator.key} className="rounded-md border border-slate-200 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => toggleIndicator(indicator.key)}
                      className="mt-1 h-4 w-4 rounded border-slate-300"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-ink">{indicator.label}</span>
                      <span className="mt-1 block text-sm text-slate-600">{indicator.description}</span>
                    </span>
                  </label>
                  <div className="flex shrink-0 gap-2">
                    <Badge tone={enabled ? "green" : "gray"}>{enabled ? "aktif" : "nonaktif"}</Badge>
                    <Badge tone="blue">bobot {pct(indicator.weight)}</Badge>
                    <Badge>skor {pct(indicator.score)}</Badge>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {indicator.subIndicators.map((subIndicator) => (
                    <span key={subIndicator} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                      {subIndicator}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-semibold text-ink">Hasil setelah indikator dipilih</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <ResultBar label="Bullish" value={adjusted.bullishProbability} />
            <ResultBar label="Bearish" value={adjusted.bearishProbability} />
            <ResultBar label="Sideways" value={adjusted.sidewaysProbability} />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <Metric label="Signal Score" value={pct(adjusted.signalScore)} />
            <Metric label="Confidence" value={pct(adjusted.confidence)} />
            <Metric label="Risk Dipakai" value={pct(adjusted.adjustedRisk)} />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Perhitungan ini hanya simulasi probabilistik berdasarkan indikator yang diaktifkan. Sistem tidak memberi saran finansial dan tidak melakukan buy/sell otomatis.
          </p>
        </div>
      </div>
    </Card>
  );
}

function ResultBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">{pct(value)}</span>
      </div>
      <div className="h-2 rounded-full bg-white">
        <div className="h-2 rounded-full bg-mint" style={{ width: pct(value) }} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-ink">{value}</div>
    </div>
  );
}
