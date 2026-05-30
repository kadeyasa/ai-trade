export type Signal = "BULLISH" | "BEARISH" | "SIDEWAYS" | "HIGH_RISK";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "EXTREME";

export type PredictionSnapshotView = {
  id?: string;
  bullishProbability: number;
  bearishProbability: number;
  sidewaysProbability: number;
  confidence: number;
  signal: Signal;
  riskLevel: RiskLevel;
  riskScore: number;
  reasons: string[];
  marketScore: number;
  socialScore: number;
  newsScore: number;
  liquidityScore: number;
  whaleScore: number;
  createdAt: string;
};

export type AlertView = {
  id?: string;
  type: string;
  severity: RiskLevel;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};
