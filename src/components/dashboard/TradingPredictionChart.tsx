"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  createSeriesMarkers,
  createChart,
  HistogramSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type SeriesMarker,
  type UTCTimestamp
} from "lightweight-charts";
import { Activity, BarChart3, CheckCircle2, Clock3, Crosshair, Gauge, GitBranch, Layers3, Shield, Target, TrendingDown, TrendingUp, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatBox } from "@/components/ui/StatBox";
import { cn } from "@/lib/utils";
import { formatUsd } from "@/lib/utils";
import type { OhlcvCandle, TradingPrediction } from "@/types/trading-prediction";

const timeframes = ["15m", "1h", "4h", "1d"] as const;
const defaultLayers = {
  ema: true,
  bollinger: false,
  supportResistance: true,
  fibonacci: true,
  prediction: true,
  signal: true,
  waves: true,
  risk: true,
  volume: true
};

function toChartTime(time: string): UTCTimestamp {
  return Math.floor(new Date(time).getTime() / 1000) as UTCTimestamp;
}

function toOrderedLineData(points: Array<{ time: string; price: number }>) {
  const byTime = new Map<number, { time: UTCTimestamp; value: number }>();
  points.forEach((point) => {
    const time = toChartTime(point.time);
    byTime.set(time, { time, value: point.price });
  });
  return Array.from(byTime.values()).sort((a, b) => Number(a.time) - Number(b.time));
}

function signalTone(signal: TradingPrediction["signal"]) {
  if (signal === "STRONG_LONG" || signal === "LONG") return "green";
  if (signal === "STRONG_SHORT" || signal === "SHORT") return "red";
  return "yellow";
}

function scenarioIcon(scenario: TradingPrediction["scenario"]) {
  if (scenario === "bullish") return <TrendingUp className="h-4 w-4" />;
  if (scenario === "bearish") return <TrendingDown className="h-4 w-4" />;
  return <Activity className="h-4 w-4" />;
}

function scenarioCopy(scenario: TradingPrediction["scenario"]) {
  if (scenario === "bullish") return "Bullish";
  if (scenario === "bearish") return "Bearish";
  return "Sideways";
}

function signalLabel(signal: TradingPrediction["signal"]) {
  return signal.replace("_", " ");
}

function scenarioStyle(scenario: TradingPrediction["scenario"]) {
  if (scenario === "bullish") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (scenario === "bearish") return "border-red-200 bg-red-50 text-red-800";
  return "border-violet-200 bg-violet-50 text-violet-800";
}

function detectionLabel(value: boolean) {
  return value ? "Aktif" : "Tidak";
}

function signalColor(signal: TradingPrediction["signal"]) {
  if (signal === "STRONG_LONG" || signal === "LONG") return "#059669";
  if (signal === "STRONG_SHORT" || signal === "SHORT") return "#dc2626";
  return "#b45309";
}

function signalOverlayClass(signal: TradingPrediction["signal"]) {
  if (signal === "STRONG_LONG" || signal === "LONG") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (signal === "STRONG_SHORT" || signal === "SHORT") return "border-red-200 bg-red-50 text-red-800";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

type BinanceKlineMessage = {
  e?: string;
  s?: string;
  k?: {
    t: number;
    T: number;
    s: string;
    i: string;
    o: string;
    c: string;
    h: string;
    l: string;
    v: string;
    x: boolean;
  };
};

function toCandleData(candle: OhlcvCandle) {
  return {
    time: toChartTime(candle.time),
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close
  };
}

function toVolumeData(candle: OhlcvCandle) {
  return {
    time: toChartTime(candle.time),
    value: candle.volume,
    color: candle.close >= candle.open ? "rgba(5, 150, 105, 0.32)" : "rgba(220, 38, 38, 0.28)"
  };
}

export function TradingPredictionChart({ coinId, prediction: initialPrediction }: { coinId: string; prediction: TradingPrediction }) {
  const [prediction, setPrediction] = useState(initialPrediction);
  const [selectedTimeframe, setSelectedTimeframe] = useState(initialPrediction.timeframe);
  const [isLoadingTimeframe, setIsLoadingTimeframe] = useState(false);
  const [liveStatus, setLiveStatus] = useState<"connecting" | "live" | "fallback">("connecting");
  const [layers, setLayers] = useState(defaultLayers);
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const closedCandleRef = useRef<string | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestIndicator = prediction.indicators.at(-1);
  const visibleConfluence = useMemo(() => prediction.confluence.slice(0, 7), [prediction.confluence]);
  const chartEvidence = useMemo(() => {
    const preferred = ["Trend", "Fibonacci", "Wave Count", "Volume", "RSI", "MACD", "Time Cycle", "Support/Resistance"];
    return preferred
      .map((name) => prediction.confluence.find((item) => item.name === name))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .slice(0, 6);
  }, [prediction.confluence]);
  const nextCycle = prediction.timeCycles.projections[0];
  const isShort = prediction.preferredDirection === "SHORT";

  function toggleLayer(key: keyof typeof defaultLayers) {
    setLayers((current) => ({ ...current, [key]: !current[key] }));
  }

  useEffect(() => {
    setPrediction(initialPrediction);
    setSelectedTimeframe(initialPrediction.timeframe);
  }, [initialPrediction]);

  async function changeTimeframe(timeframe: string) {
    setSelectedTimeframe(timeframe);
    setIsLoadingTimeframe(true);
    try {
      const response = await fetch(`/api/trading-prediction?coinId=${encodeURIComponent(coinId)}&timeframe=${encodeURIComponent(timeframe)}`);
      if (!response.ok) throw new Error(`Trading prediction failed: ${response.status}`);
      const payload = (await response.json()) as { prediction: TradingPrediction };
      setPrediction(payload.prediction);
    } finally {
      setIsLoadingTimeframe(false);
    }
  }

  const refreshPrediction = useCallback(async (timeframe = selectedTimeframe) => {
    const response = await fetch(`/api/trading-prediction?coinId=${encodeURIComponent(coinId)}&timeframe=${encodeURIComponent(timeframe)}`);
    if (!response.ok) throw new Error(`Trading prediction failed: ${response.status}`);
    const payload = (await response.json()) as { prediction: TradingPrediction };
    setPrediction(payload.prediction);
  }, [coinId, selectedTimeframe]);

  useEffect(() => {
    if (!chartRef.current) return;
    const chartIsShort = prediction.preferredDirection === "SHORT";
    const chartNextCycle = prediction.timeCycles.projections[0];

    const chart = createChart(chartRef.current, {
      height: 500,
      layout: {
        background: { type: ColorType.Solid, color: "#fbfdff" },
        textColor: "#334155"
      },
      grid: {
        vertLines: { color: "#eef2f7" },
        horzLines: { color: "#edf2f7" }
      },
      rightPriceScale: {
        borderColor: "#e2e8f0",
        scaleMargins: { top: 0.08, bottom: 0.22 }
      },
      timeScale: {
        borderColor: "#e2e8f0",
        timeVisible: true,
        secondsVisible: false
      },
      crosshair: {
        vertLine: { color: "#94a3b8" },
        horzLine: { color: "#94a3b8" }
      }
    });
    chartApiRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#059669",
      downColor: "#dc2626",
      borderVisible: false,
      wickUpColor: "#059669",
      wickDownColor: "#dc2626"
    });
    candleSeriesRef.current = candleSeries;
    candleSeries.setData(
      prediction.candles.map(toCandleData)
    );

    const lineSeries = [
      { key: "ema20", color: "#2563eb", title: "EMA 20" },
      { key: "ema50", color: "#f59e0b", title: "EMA 50" },
      { key: "ema200", color: "#64748b", title: "EMA 200" },
      { key: "bbUpper", color: "#94a3b8", title: "BB Upper" },
      { key: "bbLower", color: "#94a3b8", title: "BB Lower" }
    ] as const;

    lineSeries
      .filter(({ key }) => (key.startsWith("bb") ? layers.bollinger : layers.ema))
      .forEach(({ key, color, title }) => {
      const series = chart.addSeries(LineSeries, {
        color,
        lineWidth: key.startsWith("bb") ? 1 : 2,
        lineStyle: key.startsWith("bb") ? 2 : 0,
        priceLineVisible: false,
        title
      });
      series.setData(
        prediction.indicators
          .filter((point) => point[key] != null)
          .map((point) => ({ time: toChartTime(point.time), value: point[key]! }))
      );
    });

    const lastCandle = prediction.candles.at(-1)!;
    if (layers.prediction) {
      const path = chart.addSeries(LineSeries, {
        color: prediction.scenario === "bearish" ? "#dc2626" : prediction.scenario === "bullish" ? "#059669" : "#7c3aed",
        lineWidth: 3,
        lineStyle: 1,
        priceLineVisible: false,
        title: "Prediction Path"
      });
      path.setData([
        { time: toChartTime(lastCandle.time), value: lastCandle.close },
        ...prediction.predictionPath.map((point) => ({ time: toChartTime(point.time), value: point.price }))
      ]);
    }

    if (layers.waves && prediction.waveAnalysis.impulse.length >= 2) {
      const impulseWave = chart.addSeries(LineSeries, {
        color: prediction.waveAnalysis.direction === "SHORT" ? "#dc2626" : "#0f766e",
        lineWidth: 2,
        lineStyle: 0,
        priceLineVisible: false,
        title: "Impulse Wave"
      });
      impulseWave.setData(toOrderedLineData(prediction.waveAnalysis.impulse));
    }

    if (layers.waves && prediction.waveAnalysis.correction.length >= 2) {
      const correctionWave = chart.addSeries(LineSeries, {
        color: "#7c3aed",
        lineWidth: 2,
        lineStyle: 2,
        priceLineVisible: false,
        title: "Correction Wave"
      });
      correctionWave.setData(toOrderedLineData(prediction.waveAnalysis.correction));
    }

    if (layers.volume) {
      const volume = chart.addSeries(HistogramSeries, {
        color: "#cbd5e1",
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
        priceLineVisible: false
      });
      volumeSeriesRef.current = volume;
      chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
      volume.setData(prediction.candles.map(toVolumeData));
    } else {
      volumeSeriesRef.current = null;
    }

    const markers: SeriesMarker<UTCTimestamp>[] = [
      {
        time: toChartTime(lastCandle.time),
        position: chartIsShort ? "aboveBar" : "belowBar",
        color: signalColor(prediction.signal),
        shape: chartIsShort ? "arrowDown" : "arrowUp",
        text: signalLabel(prediction.signal)
      }
    ];
    if (chartNextCycle) {
      markers.push({
        time: toChartTime(chartNextCycle.projectedTime),
        position: "atPriceMiddle",
        price: prediction.predictionPath.at(-1)?.price ?? lastCandle.close,
        color: "#7c3aed",
        shape: "circle",
        text: "Reversal time zone"
      });
    }
    if (layers.waves) prediction.waveAnalysis.impulse.forEach((point) => {
      markers.push({
        time: toChartTime(point.time),
        position: point.type === "high" ? "aboveBar" : "belowBar",
        color: prediction.waveAnalysis.direction === "SHORT" ? "#dc2626" : "#0f766e",
        shape: "circle",
        text: `Wave ${point.label}`
      });
    });
    if (layers.waves) prediction.waveAnalysis.correction.forEach((point) => {
      markers.push({
        time: toChartTime(point.time),
        position: point.type === "high" ? "aboveBar" : "belowBar",
        color: "#7c3aed",
        shape: "square",
        text: `Wave ${point.label}`
      });
    });
    createSeriesMarkers(candleSeries, markers);

    if (layers.supportResistance) prediction.supportLevels.forEach((level) => {
      candleSeries.createPriceLine({
        price: level.price,
        color: "#059669",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: `Support ${level.touches}x`
      });
    });
    if (layers.supportResistance) prediction.resistanceLevels.forEach((level) => {
      candleSeries.createPriceLine({
        price: level.price,
        color: "#dc2626",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: `Resistance ${level.touches}x`
      });
    });
    if (layers.fibonacci) prediction.fibonacciRetracement.forEach((level) => {
      candleSeries.createPriceLine({
        price: level.price,
        color: "#7c3aed",
        lineWidth: 1,
        lineStyle: 3,
        axisLabelVisible: true,
        title: `Fib ${level.ratio}`
      });
    });
    if (layers.signal) {
      candleSeries.createPriceLine({
        price: prediction.risk.entryPrice,
        color: signalColor(prediction.signal),
        lineWidth: 3,
        lineStyle: 0,
        axisLabelVisible: true,
        title: `${signalLabel(prediction.signal)} entry`
      });
      const entryPadding = Math.max(prediction.risk.entryPrice * 0.0015, Math.abs(prediction.risk.entryPrice - prediction.risk.stopLoss) * 0.18);
      candleSeries.createPriceLine({
        price: prediction.risk.entryPrice + entryPadding,
        color: signalColor(prediction.signal),
        lineWidth: 1,
        lineStyle: 3,
        axisLabelVisible: false,
        title: "Entry zone high"
      });
      candleSeries.createPriceLine({
        price: Math.max(0, prediction.risk.entryPrice - entryPadding),
        color: signalColor(prediction.signal),
        lineWidth: 1,
        lineStyle: 3,
        axisLabelVisible: false,
        title: "Entry zone low"
      });
    }
    if (layers.risk) {
      candleSeries.createPriceLine({
        price: prediction.risk.stopLoss,
        color: "#ef4444",
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "Stop loss"
      });
      candleSeries.createPriceLine({
        price: prediction.risk.takeProfit1,
        color: "#16a34a",
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "Take profit 1"
      });
      candleSeries.createPriceLine({
        price: prediction.risk.takeProfit2,
        color: "#15803d",
        lineWidth: 2,
        lineStyle: 1,
        axisLabelVisible: true,
        title: "Take profit 2"
      });
    }

    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver(([entry]) => {
      chart.applyOptions({ width: Math.floor(entry.contentRect.width) });
    });
    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartApiRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [layers, prediction]);

  useEffect(() => {
    const symbol = prediction.symbol.toUpperCase().endsWith("USDT") ? prediction.symbol.toUpperCase() : `${prediction.symbol.toUpperCase()}USDT`;
    const streamSymbol = symbol.toLowerCase();
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streamSymbol}@kline_${selectedTimeframe}`);
    setLiveStatus("connecting");

    ws.onopen = () => setLiveStatus("live");
    ws.onerror = () => setLiveStatus("fallback");
    ws.onclose = () => setLiveStatus((current) => (current === "live" ? "fallback" : current));
    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data as string) as BinanceKlineMessage;
      if (!payload.k) return;
      const candle: OhlcvCandle = {
        time: new Date(payload.k.t).toISOString(),
        open: Number(payload.k.o),
        high: Number(payload.k.h),
        low: Number(payload.k.l),
        close: Number(payload.k.c),
        volume: Number(payload.k.v)
      };
      candleSeriesRef.current?.update(toCandleData(candle));
      volumeSeriesRef.current?.update(toVolumeData(candle));

      if (payload.k.x && closedCandleRef.current !== candle.time) {
        closedCandleRef.current = candle.time;
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = setTimeout(() => {
          refreshPrediction(selectedTimeframe).catch(() => setLiveStatus("fallback"));
        }, 250);
      }
    };

    return () => {
      ws.close();
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [coinId, prediction.symbol, refreshPrediction, selectedTimeframe]);

  return (
    <Card className="min-h-[760px] scroll-mt-6 overflow-hidden p-0" id="trading-signal-chart">
      <div className="border-b border-slate-200 bg-white px-5 py-4">
      <CardHeader
        title="Modul Prediksi Trading"
        action={
          <div className="flex items-center gap-2">
            <Badge tone={liveStatus === "live" ? "green" : liveStatus === "connecting" ? "yellow" : "gray"}>
              {liveStatus === "live" ? "Binance live" : liveStatus === "connecting" ? "Connecting" : "REST fallback"}
            </Badge>
            <Badge tone={signalTone(prediction.signal)}>{signalLabel(prediction.signal)}</Badge>
            <Badge tone="blue">{prediction.confidence}% confidence</Badge>
          </div>
        }
      />
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-sm font-medium text-slate-700">Timeframe</div>
          <div className="flex flex-wrap gap-2">
            {timeframes.map((timeframe) => (
              <button
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm font-semibold",
                  selectedTimeframe === timeframe ? "border-ink bg-ink text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                )}
                disabled={isLoadingTimeframe && selectedTimeframe === timeframe}
                key={timeframe}
                onClick={() => changeTimeframe(timeframe)}
                type="button"
              >
                {timeframe}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
          <div className={cn("rounded-md border p-4", scenarioStyle(prediction.scenario))}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide opacity-75">Skenario Utama</div>
                <div className="mt-2 flex items-center gap-2 text-3xl font-semibold">
                  {scenarioIcon(prediction.scenario)}
                  {scenarioCopy(prediction.scenario)}
                </div>
              </div>
              <div className="rounded-md bg-white/70 px-3 py-2 text-right">
                <div className="text-xs font-medium uppercase tracking-wide opacity-75">Signal</div>
                <div className="mt-1 text-2xl font-bold">{signalLabel(prediction.signal)}</div>
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-white/70">
              <div className="h-2 rounded-full bg-current" style={{ width: `${prediction.confidence}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-md bg-white/70 px-3 py-2">
                <div className="text-xs uppercase tracking-wide opacity-70">Long score</div>
                <div className="mt-1 font-semibold">{prediction.longScore}/7</div>
              </div>
              <div className="rounded-md bg-white/70 px-3 py-2">
                <div className="text-xs uppercase tracking-wide opacity-70">Short score</div>
                <div className="mt-1 font-semibold">{prediction.shortScore}/7</div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatBox label="Entry" value={formatUsd(prediction.risk.entryPrice)} detail={`${prediction.preferredDirection} setup`} icon={<Crosshair className="h-4 w-4" />} />
            <StatBox label="Stop Loss" value={formatUsd(prediction.risk.stopLoss)} detail={isShort ? "Di atas entry" : "Di bawah entry"} icon={<Shield className="h-4 w-4" />} />
            <StatBox label="Take Profit 1" value={formatUsd(prediction.risk.takeProfit1)} detail="Target awal" icon={<Target className="h-4 w-4" />} />
            <StatBox label="Take Profit 2" value={formatUsd(prediction.risk.takeProfit2)} detail={`${prediction.risk.riskRewardRatio}R`} icon={<Gauge className="h-4 w-4" />} />
          </div>
        </div>
      </div>

      <div className="px-5 py-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            {[
              ["ema", "EMA", "bg-blue-600"],
              ["bollinger", "Bollinger", "bg-slate-400"],
              ["supportResistance", "S/R", "bg-emerald-600"],
              ["fibonacci", "Fibonacci", "bg-violet-600"],
              ["prediction", "Prediction", "bg-slate-600"],
              ["signal", "Signal", "bg-emerald-600"],
              ["waves", "Wave", "bg-teal-700"],
              ["risk", "SL/TP", "bg-red-500"],
              ["volume", "Volume", "bg-slate-300"]
            ].map(([key, label, color]) => (
              <button
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium",
                  layers[key as keyof typeof defaultLayers] ? "border-slate-300 bg-white text-ink shadow-sm" : "border-slate-200 bg-slate-50 text-slate-400"
                )}
                key={key}
                onClick={() => toggleLayer(key as keyof typeof defaultLayers)}
                type="button"
              >
                <span className={cn("h-2 w-5 rounded-full", color as string, !layers[key as keyof typeof defaultLayers] && "opacity-30")} />
                {label}
              </button>
            ))}
          </div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{prediction.symbol} / {prediction.timeframe}</div>
        </div>

        <div className="relative">
          <div
            className={cn(
              "pointer-events-none absolute left-3 top-3 z-10 rounded-md border px-3 py-2 text-sm shadow-sm",
              signalOverlayClass(prediction.signal)
            )}
          >
            <div className="text-xs font-semibold uppercase tracking-wide opacity-75">Chart Signal</div>
            <div className="mt-1 text-lg font-bold">{signalLabel(prediction.signal)}</div>
            <div className="mt-1 text-xs">Entry {formatUsd(prediction.risk.entryPrice)} · {prediction.confidence}%</div>
          </div>
          <div className="pointer-events-none absolute right-3 top-3 z-10 w-[280px] rounded-md border border-slate-200 bg-white/95 p-3 text-xs shadow-sm backdrop-blur">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="font-semibold uppercase tracking-wide text-slate-500">Signal Evidence</div>
              <span className={cn("rounded-full px-2 py-0.5 font-semibold", signalOverlayClass(prediction.signal))}>{signalLabel(prediction.signal)}</span>
            </div>
            <div className="space-y-2">
              {chartEvidence.map((item) => (
                <div className="flex items-start gap-2" key={item.name}>
                  {item.passed ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />}
                  <div>
                    <div className={item.passed ? "font-semibold text-ink" : "font-semibold text-slate-500"}>{item.name}</div>
                    <div className="text-slate-500">{item.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={cn("relative h-[500px] w-full overflow-hidden rounded-md border border-slate-200 bg-[#fbfdff]", isLoadingTimeframe && "opacity-60")} ref={chartRef} />
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
                <BarChart3 className="h-4 w-4 text-slate-500" />
                Indikator Utama
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">RSI 14</div>
                  <div className="mt-1 text-xl font-semibold text-ink">{latestIndicator?.rsi14 ?? "-"}</div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">MACD Hist</div>
                  <div className="mt-1 text-xl font-semibold text-ink">{latestIndicator?.macdHistogram ?? "-"}</div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">ATR</div>
                  <div className="mt-1 text-xl font-semibold text-ink">{latestIndicator?.atr ? formatUsd(latestIndicator.atr) : "-"}</div>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
                <Layers3 className="h-4 w-4 text-slate-500" />
                Kondisi Market
              </div>
              <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                {[
                  ["Breakout", prediction.detection.breakout],
                  ["Fake breakout", prediction.detection.fakeBreakout],
                  ["Continuation", prediction.detection.trendContinuation],
                  ["Reversal zone", prediction.detection.potentialReversalZone]
                ].map(([label, value]) => (
                  <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2" key={label as string}>
                    <span>{label}</span>
                    <span className={cn("text-xs font-semibold", value ? "text-emerald-700" : "text-slate-500")}>{detectionLabel(Boolean(value))}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Gauge className="h-4 w-4 text-slate-500" />
                Confluence Score
              </div>
              <span className="text-sm font-semibold text-ink">{prediction.confidence}/100</span>
            </div>
            <div className="space-y-3">
              {visibleConfluence.map((item) => (
                <div key={item.name}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      {item.passed ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-slate-400" />}
                      <span className={item.passed ? "font-medium text-ink" : "text-slate-500"}>{item.name}</span>
                    </div>
                    <span className="text-xs text-slate-500">{item.note}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100">
                    <div className={cn("h-1.5 rounded-full", item.passed ? "bg-emerald-500" : "bg-slate-300")} style={{ width: `${item.weight}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <GitBranch className="h-4 w-4 text-slate-500" />
              Wave Detection
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={prediction.waveAnalysis.status === "VALID" ? "green" : "yellow"}>{prediction.waveAnalysis.status === "VALID" ? "Wave valid" : "Wave unclear"}</Badge>
              <Badge tone="blue">{prediction.waveAnalysis.confidence}% wave confidence</Badge>
            </div>
          </div>
          <div className="grid gap-3 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-md bg-slate-50 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Current phase</div>
              <div className="mt-2 text-xl font-semibold text-ink">{prediction.waveAnalysis.currentPhase.replaceAll("_", " ")}</div>
              <div className="mt-2 text-sm text-slate-600">{prediction.waveAnalysis.message}</div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {prediction.waveAnalysis.impulse.map((point) => (
                  <span className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-700 ring-1 ring-slate-200" key={`${point.label}-${point.time}`}>
                    {point.label}: {formatUsd(point.price)}
                  </span>
                ))}
                {prediction.waveAnalysis.correction.map((point) => (
                  <span className="rounded-full bg-violet-50 px-2.5 py-1 font-medium text-violet-700 ring-1 ring-violet-200" key={`${point.label}-${point.time}`}>
                    {point.label}: {formatUsd(point.price)}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ["Wave 2 retracement", prediction.waveAnalysis.validation.wave2Retracement],
                ["Wave 3 extension", prediction.waveAnalysis.validation.wave3Extension],
                ["Wave 4 retracement", prediction.waveAnalysis.validation.wave4Retracement],
                ["Wave 5 target", prediction.waveAnalysis.validation.wave5Target]
              ].map(([label, item]) => (
                <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm" key={label as string}>
                  <div>
                    <div className="font-medium text-ink">{label as string}</div>
                    <div className="text-xs text-slate-500">{typeof item === "object" && "value" in item && item.value != null ? `${item.value}x` : "Waiting"}</div>
                  </div>
                  {typeof item === "object" && item.valid ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-slate-400" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Clock3 className="h-4 w-4 text-slate-500" />
              Fibonacci Time Cycle
            </div>
            {nextCycle ? (
              <span className="text-xs text-slate-500">
                Next: {new Date(nextCycle.projectedTime).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            ) : null}
          </div>
          <div className="grid gap-2 sm:grid-cols-5">
            {prediction.timeCycles.projections.slice(0, 5).map((projection) => (
              <div className="rounded-md bg-slate-50 p-3 text-sm" key={projection.interval}>
                <div className="font-semibold text-ink">{projection.interval} candles</div>
                <div className="mt-1 text-xs text-slate-500">
                  {new Date(projection.projectedTime).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
