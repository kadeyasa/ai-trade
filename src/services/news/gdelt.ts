import type { NewsArticleView } from "@/types/news";

type GdeltArticle = {
  sourceCountry?: string;
  sourceCommonName?: string;
  title?: string;
  url?: string;
  seendate?: string;
  socialimage?: string;
};

export async function fetchGdeltArticles(searchTerms: string[], maxRecords = 25) {
  const query = searchTerms.filter(Boolean).join(" OR ");
  const params = new URLSearchParams({
    query,
    mode: "ArtList",
    format: "json",
    maxrecords: String(Math.min(100, Math.max(10, maxRecords))),
    sort: "HybridRel"
  });
  const response = await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?${params}`, {
    next: { revalidate: 300 }
  });
  if (!response.ok) throw new Error(`GDELT failed with ${response.status}`);

  const payload = (await response.json()) as { articles?: GdeltArticle[] };
  return (payload.articles ?? [])
    .filter((article) => article.url && article.title)
    .map((article) => ({
      source: article.sourceCommonName ?? article.sourceCountry ?? "GDELT",
      title: article.title ?? "Untitled article",
      url: article.url ?? "",
      publishedAt: article.seendate ? new Date(article.seendate).toISOString() : new Date().toISOString(),
      summary: undefined,
      relevanceScore: 0.6,
      impact: "neutral",
      impactScore: 0,
      category: "market",
      analyzedAt: undefined
    })) satisfies NewsArticleView[];
}
