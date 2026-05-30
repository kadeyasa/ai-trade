import { NextRequest, NextResponse } from "next/server";
import { guardCollector } from "@/app/api/collect/guard";
import { collectSocialPosts } from "@/services/social/social.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const blocked = guardCollector(request);
  if (blocked) return blocked;
  const posts = await collectSocialPosts();
  return NextResponse.json({ ok: true, count: posts.length, posts });
}
