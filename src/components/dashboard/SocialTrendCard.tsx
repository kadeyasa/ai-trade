import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatBox } from "@/components/ui/StatBox";
import type { SocialPostView, SocialTrendView } from "@/types/social";

export function SocialTrendCard({ trend, posts }: { trend: SocialTrendView; posts: SocialPostView[] }) {
  return (
    <Card id="social">
      <CardHeader title="Social/X Trend Monitor" />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatBox label="Mentions" value={trend.totalMentions.toLocaleString()} detail="tracked keywords" />
        <StatBox label="Positive" value={trend.positiveCount.toLocaleString()} detail={`${trend.negativeCount} negative`} />
        <StatBox label="Spam" value={trend.spamCount.toLocaleString()} detail={`velocity ${Math.round(trend.trendVelocityScore * 100)}%`} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {trend.topTopics.map((topic) => (
          <Badge key={topic} tone="blue">{topic}</Badge>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {posts.slice(0, 3).map((post) => (
          <article key={post.externalId} className="rounded-md border border-slate-200 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-ink">@{post.authorUsername}</span>
              <Badge tone={post.sentiment === "positive" ? "green" : post.sentiment === "negative" ? "red" : "gray"}>
                {post.sentiment ?? "neutral"}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-slate-600">{post.text}</p>
          </article>
        ))}
      </div>
    </Card>
  );
}
