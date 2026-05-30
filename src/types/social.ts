export type SentimentLabel = "positive" | "negative" | "neutral";

export type SocialPostView = {
  id?: string;
  source: "x" | "mock";
  externalId: string;
  authorUsername: string;
  text: string;
  url: string;
  likeCount: number;
  repostCount: number;
  replyCount: number;
  quoteCount: number;
  viewCount: number;
  sentiment?: SentimentLabel;
  sentimentScore?: number;
  spamScore?: number;
  topic?: string;
  createdAt: string;
  analyzedAt?: string;
};

export type SocialTrendView = {
  keyword: string;
  totalMentions: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  spamCount: number;
  topTopics: string[];
  trendVelocityScore: number;
  createdAt: string;
};
