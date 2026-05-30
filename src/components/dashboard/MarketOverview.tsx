import { Card, CardHeader } from "@/components/ui/Card";
import { StatBox } from "@/components/ui/StatBox";
import { formatCompact, formatUsd } from "@/lib/utils";
import type { MarketSnapshotView } from "@/types/market";

export function MarketOverview({ market }: { market: MarketSnapshotView }) {
  const buyRatio = market.txnsBuy24h / Math.max(1, market.txnsBuy24h + market.txnsSell24h);
  return (
    <Card>
      <CardHeader title="Market Monitor" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatBox label="Price" value={formatUsd(market.priceUsd)} detail={`IDR ${Math.round(market.priceIdr).toLocaleString()}`} />
        <StatBox label="Liquidity" value={formatUsd(market.liquidityUsd)} detail="DEX pool depth" />
        <StatBox label="24h Volume" value={formatUsd(market.volume24h)} detail={`${market.priceChange24h.toFixed(2)}% price change`} />
        <StatBox label="Buy Ratio" value={`${Math.round(buyRatio * 100)}%`} detail={`${formatCompact(market.txnsBuy24h)} buys / ${formatCompact(market.txnsSell24h)} sells`} />
      </div>
    </Card>
  );
}
