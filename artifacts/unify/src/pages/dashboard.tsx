import { Link } from "wouter";
import {
  useGetDashboardSummary,
  useGetActivityFeed,
  useGetMyProfile,
  useGetPostsFeed,
} from "@workspace/api-client-react";
import { PostCard } from "@/components/PostCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Coins,
  Users,
  UserCheck,
  Flame,
  Trophy,
  Sparkles,
  ArrowRight,
  Zap,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const KIND_ICONS: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  community_join: { icon: Users, color: "text-emerald-400" },
  follow: { icon: UserCheck, color: "text-violet-400" },
  post: { icon: Sparkles, color: "text-cyan-400" },
  hackathon: { icon: Zap, color: "text-amber-400" },
  resource: { icon: Trophy, color: "text-pink-400" },
  badge: { icon: Trophy, color: "text-yellow-400" },
};

export default function DashboardPage() {
  const { data: profile } = useGetMyProfile();
  const { data: summary } = useGetDashboardSummary();
  const { data: activity = [] } = useGetActivityFeed();
  const { data: posts = [] } = useGetPostsFeed();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">{greeting},</p>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-greeting">
            {profile?.username ? `@${profile.username}` : profile?.name || "Student"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here’s what’s happening across Unify today.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/discover">
            <Button variant="secondary" data-testid="button-go-discover">
              Discover people <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/communities">
            <Button data-testid="button-go-communities">
              Join a community <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Coins"
          value={summary?.coins ?? 0}
          delta={summary?.coinDelta ?? 0}
          icon={<Coins className="w-5 h-5 text-yellow-400" />}
          accent="from-yellow-500/20 to-yellow-500/0"
          testId="stat-coins"
          href="/coin-history"
        />
        <StatCard
          label="Communities"
          value={summary?.communityCount ?? 0}
          icon={<Users className="w-5 h-5 text-emerald-400" />}
          accent="from-emerald-500/20 to-emerald-500/0"
          testId="stat-communities"
          href="/communities"
        />
        <StatCard
          label="Followers"
          value={summary?.followerCount ?? 0}
          icon={<UserCheck className="w-5 h-5 text-violet-400" />}
          accent="from-violet-500/20 to-violet-500/0"
          testId="stat-followers"
          href="/followers"
        />
        <StatCard
          label="Streak"
          value={(summary as typeof summary & { streak?: number })?.streak ?? 0}
          icon={<Flame className="w-5 h-5 text-orange-400" />}
          accent="from-orange-500/20 to-orange-500/0"
          testId="stat-weekly"
        />
      </section>

      <Card className="bg-card border-card-border w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" /> Coin leaderboard
          </CardTitle>
          {summary?.myRank && (
            <div className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              Your rank: <span className="text-primary">#{summary.myRank}</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {summary?.leaderboard?.map((entry) => (
            <div
              key={entry.username}
              className={`flex items-center gap-4 p-3 rounded-lg ${
                entry.isYou
                  ? "bg-primary/15 border border-primary/30"
                  : "hover:bg-accent/10"
              }`}
              data-testid={`leaderboard-${entry.rank}`}
            >
              <div className="w-8 text-center text-sm font-bold text-muted-foreground">
                #{entry.rank}
              </div>
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback
                  style={{ backgroundColor: entry.avatarColor }}
                  className="text-white text-xs font-semibold"
                >
                  {entry.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  @{entry.username} {entry.isYou && <span className="text-xs text-primary">(you)</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold flex-shrink-0">
                <Coins className="w-3.5 h-3.5 text-yellow-400" />
                {entry.coins.toLocaleString()}
              </div>
            </div>
          ))}
          {(!summary?.leaderboard || summary.leaderboard.length === 0) && (
            <div className="text-sm text-muted-foreground py-6 text-center">
              Leaderboard fills up as students earn coins.
            </div>
          )}
        </CardContent>
      </Card>

      {summary && summary.topInterests.length > 0 && (
        <Card className="bg-card border-card-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Your interests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {summary.topInterests.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-secondary border border-border text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  delta,
  icon,
  accent,
  suffix,
  testId,
  href,
}: {
  label: string;
  value: number;
  delta?: number;
  icon: React.ReactNode;
  accent: string;
  suffix?: string;
  testId?: string;
  href?: string;
}) {
  const inner = (
    <>
      <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-60 pointer-events-none`} />
      <div className="relative flex items-start justify-between h-full">
        <div className="flex flex-col justify-between h-full">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              {label}
            </div>
            <div className="text-3xl font-bold mt-1 flex items-baseline gap-1">
              {value.toLocaleString()}
              {suffix && (
                <span className="text-sm font-medium text-muted-foreground">
                  {suffix}
                </span>
              )}
            </div>
          </div>
          <div className="h-4 mt-1">
            {typeof delta === "number" && delta !== 0 && (
              <div className="text-xs text-emerald-400 flex items-center gap-1">
                +{delta} this week
              </div>
            )}
          </div>
        </div>
        <div className="p-2 rounded-lg bg-background/40 border border-border/40 flex-shrink-0">
          {icon}
        </div>
      </div>
    </>
  );

  const sharedClass = "relative overflow-hidden rounded-xl border border-card-border bg-card p-5 h-28 flex flex-col";

  if (href) {
    return (
      <Link href={href}>
        <div
          className={`${sharedClass} cursor-pointer hover:border-primary/40 hover:shadow-md transition-all`}
          data-testid={testId}
        >
          {inner}
        </div>
      </Link>
    );
  }

  return (
    <div
      className={sharedClass}
      data-testid={testId}
    >
      {inner}
    </div>
  );
}
