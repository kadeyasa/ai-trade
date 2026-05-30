import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { NewsArticleView } from "@/types/news";

export function NewsImpactPanel({ articles }: { articles: NewsArticleView[] }) {
  return (
    <Card id="news">
      <CardHeader title="News Intelligence" />
      <div className="space-y-3">
        {articles.slice(0, 5).map((article) => (
          <article key={article.url} className="rounded-md border border-slate-200 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={article.impact === "positive" ? "green" : article.impact === "negative" ? "red" : "gray"}>
                {article.impact ?? "neutral"}
              </Badge>
              <span className="text-xs text-slate-500">{article.source}</span>
              <span className="text-xs text-slate-500">relevance {Math.round(article.relevanceScore * 100)}%</span>
            </div>
            <h3 className="mt-2 text-sm font-semibold text-ink">{article.title}</h3>
            {article.summary ? <p className="mt-1 text-sm text-slate-600">{article.summary}</p> : null}
          </article>
        ))}
      </div>
    </Card>
  );
}
