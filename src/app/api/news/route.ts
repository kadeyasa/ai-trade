import { NextResponse } from "next/server";
import { getNewsArticles } from "@/services/news/news.service";

export async function GET() {
  const articles = await getNewsArticles();
  return NextResponse.json({ articles });
}
