import type { NewsArticleView } from "@/types/news";
import { getOpenAIClient } from "@/services/ai/openai";

function heuristicNews(article: NewsArticleView): NewsArticleView {
  const text = `${article.title} ${article.summary ?? ""}`.toLowerCase();
  const negative = ["hack", "exploit", "regulation", "lawsuit", "liquidity crisis", "rug"];
  const positive = ["listing", "partnership", "burn", "staking", "liquidity added", "audit"];
  const impactScore =
    positive.filter((word) => text.includes(word)).length * 0.22 -
    negative.filter((word) => text.includes(word)).length * 0.26;
  return {
    ...article,
    impact: impactScore > 0.1 ? "positive" : impactScore < -0.1 ? "negative" : "neutral",
    impactScore: Math.max(-1, Math.min(1, impactScore)),
    relevanceScore: article.relevanceScore,
    category:
      article.category ??
      (text.includes("regulation") ? "regulation" : text.includes("liquidity") ? "liquidity" : "market"),
    analyzedAt: new Date().toISOString()
  };
}

export async function analyzeNewsImpact(articles: NewsArticleView[]) {
  const client = getOpenAIClient();
  if (!client || !articles.length) return articles.map(heuristicNews);

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Analyze crypto news for token relevance and market impact. Return JSON {items:[{url,relevanceScore,impact,impactScore,category,summary}]} only. impact is positive, negative, or neutral."
        },
        {
          role: "user",
          content: JSON.stringify(articles.map(({ url, title, summary }) => ({ url, title, summary })))
        }
      ]
    });
    const parsed = JSON.parse(response.choices[0]?.message.content ?? "{}") as {
      items?: Array<Partial<NewsArticleView> & { url: string }>;
    };
    return articles.map((article) => {
      const match = parsed.items?.find((item) => item.url === article.url);
      return heuristicNews({ ...article, ...match });
    });
  } catch {
    return articles.map(heuristicNews);
  }
}
