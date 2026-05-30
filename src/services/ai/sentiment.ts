import type { SocialPostView } from "@/types/social";
import { getOpenAIClient } from "@/services/ai/openai";

function heuristicAnalyze(post: SocialPostView): SocialPostView {
  const text = post.text.toLowerCase();
  const positive = ["bull", "grow", "staking", "burn", "transparent", "partnership", "listing"];
  const negative = ["hack", "exploit", "scam", "dump", "rug", "sell pressure", "risk"];
  const score =
    positive.filter((word) => text.includes(word)).length * 0.22 -
    negative.filter((word) => text.includes(word)).length * 0.28;
  const spamScore = /(airdrop|100x|guaranteed|dm me)/i.test(post.text) ? 0.7 : post.spamScore ?? 0.08;
  return {
    ...post,
    sentiment: score > 0.12 ? "positive" : score < -0.12 ? "negative" : "neutral",
    sentimentScore: Math.max(-1, Math.min(1, score)),
    spamScore,
    topic: post.topic ?? (text.includes("liquidity") ? "liquidity" : text.includes("staking") ? "staking" : "market"),
    analyzedAt: new Date().toISOString()
  };
}

export async function analyzeSocialPosts(posts: SocialPostView[]) {
  const client = getOpenAIClient();
  if (!client || !posts.length) return posts.map(heuristicAnalyze);

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Analyze crypto social posts. Return JSON {items:[{externalId,sentiment,sentimentScore,spamScore,topic}]} only. sentiment is positive, negative, or neutral. Scores are -1..1 for sentiment and 0..1 for spam."
        },
        {
          role: "user",
          content: JSON.stringify(posts.map(({ externalId, text }) => ({ externalId, text })))
        }
      ]
    });
    const parsed = JSON.parse(response.choices[0]?.message.content ?? "{}") as {
      items?: Array<Partial<SocialPostView> & { externalId: string }>;
    };
    return posts.map((post) => {
      const match = parsed.items?.find((item) => item.externalId === post.externalId);
      return heuristicAnalyze({ ...post, ...match });
    });
  } catch {
    return posts.map(heuristicAnalyze);
  }
}
