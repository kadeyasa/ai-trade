export type EntryInsight = {
  currentPrice: number;
  supportPrice: number;
  resistancePrice: number;
  pullbackZoneLow: number;
  pullbackZoneHigh: number;
  breakoutTrigger: number;
  invalidationPrice: number;
  targetObservation1: number;
  targetObservation2: number;
  riskRewardProxy: number;
  setupQuality: "KUAT" | "CUKUP" | "LEMAH" | "BERISIKO";
  reasons: string[];
};
