-- CreateTable
CREATE TABLE "TokenConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "pairAddress" TEXT,
    "dexName" TEXT NOT NULL,
    "openPriceIdr" DECIMAL(20,8) NOT NULL,
    "totalSupply" DECIMAL(30,8) NOT NULL,
    "stakingReserve" DECIMAL(30,8) NOT NULL,
    "rewardEmissionDailyCap" DECIMAL(30,8) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketSnapshot" (
    "id" TEXT NOT NULL,
    "tokenConfigId" TEXT NOT NULL,
    "priceUsd" DECIMAL(20,10) NOT NULL,
    "priceIdr" DECIMAL(20,8) NOT NULL,
    "liquidityUsd" DECIMAL(20,2) NOT NULL,
    "volume24h" DECIMAL(20,2) NOT NULL,
    "marketCap" DECIMAL(20,2),
    "fdv" DECIMAL(20,2),
    "txnsBuy24h" INTEGER NOT NULL,
    "txnsSell24h" INTEGER NOT NULL,
    "priceChange1h" DECIMAL(10,4) NOT NULL,
    "priceChange6h" DECIMAL(10,4) NOT NULL,
    "priceChange24h" DECIMAL(10,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "authorUsername" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "repostCount" INTEGER NOT NULL DEFAULT 0,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "quoteCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "sentiment" TEXT,
    "sentimentScore" DECIMAL(5,4),
    "spamScore" DECIMAL(5,4),
    "topic" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "analyzedAt" TIMESTAMP(3),

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialTrendSnapshot" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "totalMentions" INTEGER NOT NULL,
    "positiveCount" INTEGER NOT NULL,
    "negativeCount" INTEGER NOT NULL,
    "neutralCount" INTEGER NOT NULL,
    "spamCount" INTEGER NOT NULL,
    "topTopicsJson" JSONB NOT NULL,
    "trendVelocityScore" DECIMAL(6,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialTrendSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsArticle" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "summary" TEXT,
    "relevanceScore" DECIMAL(5,4) NOT NULL,
    "impact" TEXT,
    "impactScore" DECIMAL(5,4),
    "category" TEXT,
    "analyzedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictionSnapshot" (
    "id" TEXT NOT NULL,
    "bullishProbability" DECIMAL(5,4) NOT NULL,
    "bearishProbability" DECIMAL(5,4) NOT NULL,
    "sidewaysProbability" DECIMAL(5,4) NOT NULL,
    "confidence" DECIMAL(5,4) NOT NULL,
    "signal" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "riskScore" DECIMAL(5,4) NOT NULL,
    "reasonsJson" JSONB NOT NULL,
    "marketScore" DECIMAL(5,4) NOT NULL,
    "socialScore" DECIMAL(5,4) NOT NULL,
    "newsScore" DECIMAL(5,4) NOT NULL,
    "liquidityScore" DECIMAL(5,4) NOT NULL,
    "whaleScore" DECIMAL(5,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PredictionSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiLog" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketSnapshot_tokenConfigId_createdAt_idx" ON "MarketSnapshot"("tokenConfigId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SocialPost_externalId_key" ON "SocialPost"("externalId");

-- CreateIndex
CREATE INDEX "SocialPost_source_createdAt_idx" ON "SocialPost"("source", "createdAt");

-- CreateIndex
CREATE INDEX "SocialPost_sentiment_idx" ON "SocialPost"("sentiment");

-- CreateIndex
CREATE INDEX "SocialTrendSnapshot_keyword_createdAt_idx" ON "SocialTrendSnapshot"("keyword", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NewsArticle_url_key" ON "NewsArticle"("url");

-- CreateIndex
CREATE INDEX "NewsArticle_publishedAt_idx" ON "NewsArticle"("publishedAt");

-- CreateIndex
CREATE INDEX "NewsArticle_impact_idx" ON "NewsArticle"("impact");

-- CreateIndex
CREATE INDEX "PredictionSnapshot_createdAt_idx" ON "PredictionSnapshot"("createdAt");

-- CreateIndex
CREATE INDEX "PredictionSnapshot_signal_riskLevel_idx" ON "PredictionSnapshot"("signal", "riskLevel");

-- CreateIndex
CREATE INDEX "Alert_severity_isRead_idx" ON "Alert"("severity", "isRead");

-- CreateIndex
CREATE INDEX "ApiLog_provider_createdAt_idx" ON "ApiLog"("provider", "createdAt");

-- AddForeignKey
ALTER TABLE "MarketSnapshot" ADD CONSTRAINT "MarketSnapshot_tokenConfigId_fkey" FOREIGN KEY ("tokenConfigId") REFERENCES "TokenConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
