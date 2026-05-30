import { Card, CardHeader } from "@/components/ui/Card";
import { StatBox } from "@/components/ui/StatBox";
import { formatCompact } from "@/lib/utils";
import type { TokenConfigView } from "@/types/token";

export function TokenHealthPanel({ token }: { token: TokenConfigView }) {
  return (
    <Card>
      <CardHeader title="Token Health" />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatBox label="Supply" value={formatCompact(token.totalSupply)} detail="total token supply" />
        <StatBox label="Staking Reserve" value={formatCompact(token.stakingReserve)} detail="reward pool" />
        <StatBox label="Daily Emission Cap" value={formatCompact(token.rewardEmissionDailyCap)} detail="staking rewards" />
      </div>
      <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
        Claim fee, burn mechanics, liquidity depth, and affiliate/rank growth should be monitored together because reward emissions can create cyclical sell pressure.
      </div>
    </Card>
  );
}
