import { tokenConfig } from "@/config/token";
import { getAdminSettings } from "@/lib/admin-settings";
import { isMockMode } from "@/lib/env";
import { mockNews } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import type { NewsArticleView } from "@/types/news";
import { analyzeNewsImpact } from "@/services/ai/news-impact";
import { fetchGdeltArticles } from "@/services/news/gdelt";

const newsTerms = [
  tokenConfig.name,
  tokenConfig.symbol,
  tokenConfig.contractAddress,
  tokenConfig.chain,
  tokenConfig.dexName,
  "crypto regulation",
  "exploit",
  "hack",
  "listing",
  "partnership",
  "liquidity",
  "staking",
  "burn"
];

export async function getNewsArticles(): Promise<NewsArticleView[]> {
  if (isMockMode()) return mockNews;
  const rows = await prisma.newsArticle.findMany({ orderBy: { publishedAt: "desc" }, take: 20 });
  return rows.map((row) => ({
    id: row.id,
    source: row.source,
    title: row.title,
    url: row.url,
    publishedAt: row.publishedAt.toISOString(),
    summary: row.summary ?? undefined,
    relevanceScore: Number(row.relevanceScore),
    impact: row.impact as NewsArticleView["impact"],
    impactScore: row.impactScore == null ? undefined : Number(row.impactScore),
    category: row.category ?? undefined,
    analyzedAt: row.analyzedAt?.toISOString(),
    createdAt: row.createdAt.toISOString()
  }));
}

export async function getNewsForToken(token: { name: string; symbol: string; contractAddress?: string; chain?: string; dexName?: string }) {
  const limit = getAdminSettings().newsAnalysisLimit;
  const terms = [
    token.name,
    token.symbol,
    token.contractAddress ?? "",
    token.chain ?? "",
    token.dexName ?? "",
    "crypto regulation",
    "exploit",
    "hack",
    "listing",
    "partnership",
    "liquidity",
    "staking",
    "burn"
  ].filter(Boolean);

  const articles =
    (await fetchGdeltArticles(terms, limit).then(analyzeNewsImpact).catch(() => null)) ??
    createFallbackNewsArticles(token, limit);

  return articles;
}

function createFallbackNewsArticles(token: { name: string; symbol: string }, limit: number) {
  const templates = [
    ["Market liquidity remains a key focus for crypto assets", "liquidity"],
    ["Exchange listing speculation increases short-term attention", "listing"],
    ["Regulatory discussions continue across digital asset markets", "regulation"],
    ["Token burn and supply narratives shape investor perception", "tokenomics"],
    ["Partnership news can influence social momentum", "partnership"],
    ["Security and exploit monitoring remains important for crypto holders", "security"],
    ["Staking reward models face scrutiny during volatile markets", "staking"],
    ["Volume growth draws attention from market analysts", "market"]
  ] as const;

  return Array.from({ length: limit }, (_, index) => {
    const [title, category] = templates[index % templates.length];
    const base = mockNews[index % mockNews.length];
    return {
      ...base,
      source: "GDELT Cadangan",
      title: `${token.symbol.toUpperCase()}: ${title}`,
      url: `https://example.com/news/${token.symbol.toLowerCase()}-${index + 1}`,
      publishedAt: new Date(Date.now() - (index + 2) * 60 * 60 * 1000).toISOString(),
      summary: `${token.name} dianalisa dalam konteks ${category}, market trend, risk warning, dan sentiment publik.`,
      relevanceScore: 0.55 + (index % 5) * 0.06,
      category,
      analyzedAt: new Date().toISOString()
    } satisfies NewsArticleView;
  });
}

export function getLightweightNewsForToken(token: { name: string; symbol: string }) {
  const now = new Date().toISOString();
  return [
    {
      source: "CoinGecko Mode",
      title: `${token.name} market analysis loaded from CoinGecko`,
      url: "https://www.coingecko.com/",
      publishedAt: now,
      summary: "Mode ringan aktif: dashboard hanya memuat data market CoinGecko agar halaman cepat dan tidak memanggil terlalu banyak API.",
      relevanceScore: 0.5,
      impact: "neutral",
      impactScore: 0,
      category: "market",
      analyzedAt: now,
      createdAt: now
    }
  ] satisfies NewsArticleView[];
}

export async function collectNewsArticles() {
  if (isMockMode()) return mockNews;
  const articles = (await fetchGdeltArticles(newsTerms).catch(() => null)) ?? mockNews;
  const analyzed = await analyzeNewsImpact(articles);

  await Promise.all(
    analyzed.map((article) =>
      prisma.newsArticle.upsert({
        where: { url: article.url },
        create: {
          ...article,
          publishedAt: new Date(article.publishedAt),
          analyzedAt: article.analyzedAt ? new Date(article.analyzedAt) : null
        },
        update: {
          ...article,
          publishedAt: new Date(article.publishedAt),
          analyzedAt: article.analyzedAt ? new Date(article.analyzedAt) : null
        }
      })
    )
  );

  return analyzed;
}
