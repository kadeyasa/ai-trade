CREATE TABLE "TradingAnalysis" (
  "id" TEXT NOT NULL,
  "symbol" TEXT NOT NULL,
  "timeframe" TEXT NOT NULL,
  "signal" TEXT NOT NULL,
  "scenario" TEXT NOT NULL,
  "confidence" INTEGER NOT NULL,
  "entryPrice" DECIMAL(20, 10) NOT NULL,
  "stopLoss" DECIMAL(20, 10) NOT NULL,
  "takeProfit1" DECIMAL(20, 10) NOT NULL,
  "takeProfit2" DECIMAL(20, 10) NOT NULL,
  "riskRewardRatio" DECIMAL(10, 4) NOT NULL,
  "analysisJson" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TradingAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TradingAnalysis_symbol_timeframe_createdAt_idx" ON "TradingAnalysis"("symbol", "timeframe", "createdAt");
CREATE INDEX "TradingAnalysis_signal_scenario_idx" ON "TradingAnalysis"("signal", "scenario");
