export const scoringWeights = {
  marketMomentum: 0.3,
  socialSentiment: 0.25,
  newsImpact: 0.2,
  liquidityHealth: 0.15,
  riskAdjustment: 0.1
} as const;

export const riskThresholds = {
  low: 0.25,
  medium: 0.5,
  high: 0.75
} as const;
