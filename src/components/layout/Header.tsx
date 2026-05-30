import { AlertTriangle } from "lucide-react";
import { dashboardConfig } from "@/config/dashboard";
import type { TokenConfigView } from "@/types/token";
import { Badge } from "@/components/ui/Badge";

export function Header({ token }: { token: TokenConfigView }) {
  return (
    <header className="border-b border-slate-200 bg-white px-5 py-4 lg:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-ink">{token.name}</h1>
            <Badge tone="blue">{token.symbol}</Badge>
            <Badge>{token.chain}</Badge>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">{dashboardConfig.disclaimer}</p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4" />
          Bukan instruksi buy/sell
        </div>
      </div>
    </header>
  );
}
