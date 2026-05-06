import { useGetMyActivity, useGetDashboardSummary } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Coins, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const KIND_LABELS: Record<string, string> = {
  post: "Posted content",
  community_join: "Joined a community",
  community_leave: "Left a community",
  hackathon: "Hackathon participation",
  resource: "Helpful mentorship reply",
  follow: "Followed someone",
  community_post: "Community post",
  badge: "Badge earned",
};

export default function CoinHistoryPage() {
  const [, navigate] = useLocation();
  const { data: activity = [], isLoading } = useGetMyActivity();
  const { data: summary } = useGetDashboardSummary();

  const coinEvents = activity.filter((a) => a.coinsDelta !== 0);
  const totalEarned = coinEvents
    .filter((a) => a.coinsDelta > 0)
    .reduce((sum, a) => sum + a.coinsDelta, 0);

  return (
    <div className="p-8 space-y-6 max-w-3xl mx-auto">
      <button
        onClick={() => navigate("/dashboard")}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to dashboard
      </button>

      <header>
        <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium uppercase tracking-widest">
          <Coins className="w-4 h-4" /> Coins
        </div>
        <h1 className="text-3xl font-bold tracking-tight mt-1">Coin history</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track how you've earned your coins.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card border-card-border">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Current balance</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{summary?.coins?.toLocaleString() ?? 0}</span>
              <Coins className="w-5 h-5 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-card-border">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Total earned (recent)</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-400">+{totalEarned}</span>
              <Coins className="w-5 h-5 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-card-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold">How to earn coins</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-emerald-400 font-semibold">+2</span> Creating a post
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-emerald-400 font-semibold">+10</span> Joining a community
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-emerald-400 font-semibold">+5</span> Hackathon participation
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-emerald-400 font-semibold">+5</span> Helpful mentorship reply
          </div>
        </CardContent>
      </Card>

      <div className="space-y-1">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground font-medium pt-2">Recent activity</h2>

        {isLoading && (
          <div className="text-sm text-muted-foreground py-8 text-center">Loading history…</div>
        )}

        {!isLoading && activity.length === 0 && (
          <Card className="bg-card border-card-border">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No activity yet. Start posting and joining communities to earn coins!
            </CardContent>
          </Card>
        )}

        {activity.map((entry) => {
          const label = KIND_LABELS[entry.kind] ?? entry.kind;
          const isPositive = entry.coinsDelta > 0;
          const isNegative = entry.coinsDelta < 0;
          return (
            <div
              key={entry.id}
              className="flex items-center gap-4 p-3 rounded-lg border border-border/60 bg-card hover:bg-accent/10 transition-colors"
            >
              <div className={`p-2 rounded-lg ${isPositive ? "bg-emerald-500/10" : isNegative ? "bg-destructive/10" : "bg-secondary"}`}>
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                ) : isNegative ? (
                  <TrendingDown className="w-4 h-4 text-destructive" />
                ) : (
                  <Minus className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{label}</div>
                <div className="text-xs text-muted-foreground">{entry.message}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                </div>
              </div>
              {entry.coinsDelta !== 0 && (
                <div className={`text-sm font-bold flex-shrink-0 flex items-center gap-1 ${isPositive ? "text-emerald-400" : "text-destructive"}`}>
                  {isPositive ? "+" : ""}{entry.coinsDelta}
                  <Coins className="w-3.5 h-3.5 text-yellow-400" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
