export type TokenConfigView = {
  id: string;
  name: string;
  symbol: string;
  chain: string;
  contractAddress: string;
  pairAddress?: string | null;
  dexName: string;
  openPriceIdr: number;
  totalSupply: number;
  stakingReserve: number;
  rewardEmissionDailyCap: number;
};
