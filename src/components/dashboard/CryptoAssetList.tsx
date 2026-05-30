"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { BarChart3, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { Table, Td, Th } from "@/components/ui/Table";
import { LoadingLink } from "@/components/layout/NavigationLoadingProvider";
import { formatUsd } from "@/lib/utils";
import type { CryptoAsset } from "@/types/market";

export function CryptoAssetList({ assets, isFallback }: { assets: CryptoAsset[]; isFallback: boolean }) {
  const [query, setQuery] = useState("");
  const filteredAssets = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return assets;
    return assets.filter(
      (asset) =>
        asset.name.toLowerCase().includes(normalized) ||
        asset.symbol.toLowerCase().includes(normalized) ||
        asset.id.toLowerCase().includes(normalized)
    );
  }, [assets, query]);

  return (
    <Card>
      <CardHeader
        title="Daftar Cryptocurrency"
        action={<Badge tone={isFallback ? "yellow" : "green"}>{isFallback ? "data cadangan" : "real CoinGecko"}</Badge>}
      />
      <div className="mb-4 flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
        <Search className="h-4 w-4" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-w-0 flex-1 bg-transparent outline-none"
          placeholder="Cari nama, symbol, atau coin id..."
        />
      </div>
      <Table>
        <thead>
          <tr>
            <Th>#</Th>
            <Th>Token</Th>
            <Th>Harga</Th>
            <Th>Market Cap</Th>
            <Th>Volume 24h</Th>
            <Th>24h</Th>
            <Th>Aksi</Th>
          </tr>
        </thead>
        <tbody>
          {filteredAssets.map((asset) => (
            <tr key={asset.id}>
              <Td>{asset.marketCapRank ?? "-"}</Td>
              <Td>
                <div className="flex items-center gap-3">
                  {asset.image ? <Image src={asset.image} alt="" width={28} height={28} className="rounded-full" /> : null}
                  <div>
                    <div className="font-semibold text-ink">{asset.name}</div>
                    <div className="text-xs uppercase text-slate-500">{asset.symbol}</div>
                  </div>
                </div>
              </Td>
              <Td>{formatUsd(asset.currentPriceUsd)}</Td>
              <Td>{formatUsd(asset.marketCap)}</Td>
              <Td>{formatUsd(asset.volume24h)}</Td>
              <Td>
                <span className={asset.priceChange24h >= 0 ? "text-emerald-700" : "text-red-700"}>
                  {asset.priceChange24h.toFixed(2)}%
                </span>
              </Td>
              <Td>
                <LoadingLink
                  href={`/dashboard?coinId=${asset.id}`}
                  className="inline-flex items-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
                >
                  <BarChart3 className="h-4 w-4" />
                  Analisa
                </LoadingLink>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <p className="mt-4 text-sm text-slate-500">
        Menampilkan {filteredAssets.length.toLocaleString()} dari {assets.length.toLocaleString()} aset. Data daftar berasal dari CoinGecko
        markets API. Jika API tidak bisa diakses, sistem memakai data cadangan.
      </p>
    </Card>
  );
}
