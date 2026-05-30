import { NextRequest, NextResponse } from "next/server";
import { guardCollector } from "@/app/api/collect/guard";
import { collectNewsArticles } from "@/services/news/news.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const blocked = guardCollector(request);
  if (blocked) return blocked;
  const articles = await collectNewsArticles();
  return NextResponse.json({ ok: true, count: articles.length, articles });
}
