export type NewsImpact = "positive" | "negative" | "neutral";

export type NewsArticleView = {
  id?: string;
  source: string;
  title: string;
  url: string;
  publishedAt: string;
  summary?: string;
  relevanceScore: number;
  impact?: NewsImpact;
  impactScore?: number;
  category?: string;
  analyzedAt?: string;
  createdAt?: string;
};
