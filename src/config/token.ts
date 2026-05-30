import { env } from "@/lib/env";
import type { TokenConfigView } from "@/types/token";

export const tokenConfig: TokenConfigView = {
  id: "default-token",
  name: env.TOKEN_NAME,
  symbol: env.TOKEN_SYMBOL,
  chain: env.TOKEN_CHAIN,
  contractAddress: env.TOKEN_CONTRACT_ADDRESS,
  pairAddress: env.TOKEN_PAIR_ADDRESS,
  dexName: env.TOKEN_DEX_NAME,
  openPriceIdr: Number(env.TOKEN_OPEN_PRICE_IDR),
  totalSupply: 1_000_000_000,
  stakingReserve: 120_000_000,
  rewardEmissionDailyCap: 250_000
};
