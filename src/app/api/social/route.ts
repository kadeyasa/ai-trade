import { NextResponse } from "next/server";
import { getSocialPosts, getSocialTrend } from "@/services/social/social.service";

export async function GET() {
  const [trend, posts] = await Promise.all([getSocialTrend(), getSocialPosts()]);
  return NextResponse.json({ trend, posts });
}
