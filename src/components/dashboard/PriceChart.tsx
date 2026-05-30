"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardHeader } from "@/components/ui/Card";
import type { MarketSeriesPoint } from "@/types/market";

export function PriceChart({ series }: { series: MarketSeriesPoint[] }) {
  const data = series.map((point) => ({
    ...point,
    timeLabel: new Date(point.time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  }));

  return (
    <Card className="min-h-[340px]">
      <CardHeader title="Price and Liquidity Trend" />
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="priceFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#1f9d72" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#1f9d72" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis dataKey="timeLabel" tick={{ fontSize: 12 }} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} width={52} />
            <Tooltip />
            <Area type="monotone" dataKey="priceUsd" stroke="#1f9d72" fill="url(#priceFill)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
