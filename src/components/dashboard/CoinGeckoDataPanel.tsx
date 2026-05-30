import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatBox } from "@/components/ui/StatBox";
import { formatUsd } from "@/lib/utils";
import type { CryptoAsset } from "@/types/market";

export function CoinGeckoDataPanel({ asset }: { asset: CryptoAsset }) {
  return (
    <Card>
      <CardHeader title="CoinGecko Data" action={<Badge tone="green">real market data</Badge>} />
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          {asset.image ? <Image src={asset.image} alt="" width={40} height={40} className="rounded-full" /> : null}
          <div>
            <h2 className="text-xl font-semibold text-ink">{asset.name}</h2>
            <div className="text-sm uppercase text-slate-500">{asset.symbol} · rank #{asset.marketCapRank ?? "-"}</div>
          </div>
        </div>
        <Badge tone={asset.priceChange24h >= 0 ? "green" : "red"}>{asset.priceChange24h.toFixed(2)}% 24h</Badge>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatBox label="Harga" value={formatUsd(asset.currentPriceUsd)} />
        <StatBox label="Market Cap" value={formatUsd(asset.marketCap)} />
        <StatBox label="FDV" value={formatUsd(asset.fdv)} />
        <StatBox label="Volume 24h" value={formatUsd(asset.volume24h)} />
      </div>
    </Card>
  );
}
