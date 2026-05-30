import { NextResponse } from "next/server";
import { getNewsArticles } from "@/services/news/news.service";
import { getSocialPosts } from "@/services/social/social.service";
import { analyzeNewsImpact } from "@/services/ai/news-impact";
import { analyzeSocialPosts } from "@/services/ai/sentiment";

export async function POST() {
  const [posts, articles] = await Promise.all([getSocialPosts(), getNewsArticles()]);
  const [social, news] = await Promise.all([analyzeSocialPosts(posts), analyzeNewsImpact(articles)]);
  return NextResponse.json({ social, news });
}
