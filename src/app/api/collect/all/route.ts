import { NextRequest, NextResponse } from "next/server";
import { guardCollector } from "@/app/api/collect/guard";
import { collectMarketSnapshot } from "@/services/market/market.service";
import { collectNewsArticles } from "@/services/news/news.service";
import { collectSocialPosts } from "@/services/social/social.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const guarded = guardCollector(request);
  if (guarded) return guarded;

  const [market, social, news] = await Promise.allSettled([
    collectMarketSnapshot(),
    collectSocialPosts(),
    collectNewsArticles()
  ]);

  return NextResponse.json({
    ok: [market, social, news].every((result) => result.status === "fulfilled"),
    market: market.status,
    social: social.status,
    news: news.status
  });
}
