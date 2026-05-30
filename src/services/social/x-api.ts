import { getXBearerToken } from "@/lib/admin-settings";
import { hasSecret } from "@/lib/env";
import type { SocialPostView } from "@/types/social";

type XTweet = {
  id: string;
  text: string;
  created_at: string;
  public_metrics?: {
    like_count?: number;
    retweet_count?: number;
    reply_count?: number;
    quote_count?: number;
    impression_count?: number;
  };
  author_id?: string;
};

export async function fetchXPosts(queries: string[], maxResults = 25) {
  const token = getXBearerToken();
  if (!hasSecret(token)) return null;
  const query = queries.filter(Boolean).map((item) => `"${item}"`).join(" OR ");
  const params = new URLSearchParams({
    query: `${query} -is:retweet lang:en`,
    max_results: String(Math.min(100, Math.max(10, maxResults))),
    "tweet.fields": "created_at,public_metrics,author_id"
  });
  const response = await fetch(`https://api.twitter.com/2/tweets/search/recent?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 120 }
  });
  if (!response.ok) throw new Error(`X API failed with ${response.status}`);

  const payload = (await response.json()) as { data?: XTweet[] };
  return (payload.data ?? []).map((tweet) => {
    const metrics = tweet.public_metrics ?? {};
    return {
      source: "x",
      externalId: tweet.id,
      authorUsername: tweet.author_id ?? "unknown",
      text: tweet.text,
      url: `https://x.com/i/web/status/${tweet.id}`,
      likeCount: metrics.like_count ?? 0,
      repostCount: metrics.retweet_count ?? 0,
      replyCount: metrics.reply_count ?? 0,
      quoteCount: metrics.quote_count ?? 0,
      viewCount: metrics.impression_count ?? 0,
      createdAt: tweet.created_at
    } satisfies SocialPostView;
  });
}
