export type AnalysisSource = {
  name: string;
  provider: string;
  status: "REAL" | "FALLBACK" | "DISABLED";
  analyzedCount: number;
  note: string;
};

export type ComprehensiveAnalysis = {
  method: "OPENAI" | "HEURISTIC";
  summary: string;
  opportunities: string[];
  risks: string[];
  nextWatchItems: string[];
};
