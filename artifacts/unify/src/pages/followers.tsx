import { useGetMyFollowers, useRemoveFollower, getGetMyFollowersQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, UserMinus, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function FollowersPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { data: followers = [], isLoading } = useGetMyFollowers();
  const remove = useRemoveFollower();

  async function handleRemove(username: string) {
    try {
      await remove.mutateAsync({ username });
      qc.invalidateQueries({ queryKey: getGetMyFollowersQueryKey() });
      qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      toast({ title: "Follower removed", description: `@${username} has been removed from your followers.` });
    } catch {
      toast({ title: "Failed to remove follower", variant: "destructive" });
    }
  }

  return (
    <div className="p-8 space-y-6 max-w-3xl mx-auto">
      <button
        onClick={() => navigate("/dashboard")}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to dashboard
      </button>

      <header>
        <div className="flex items-center gap-2 text-primary text-sm font-medium uppercase tracking-widest">
          <Users className="w-4 h-4" /> Followers
        </div>
        <h1 className="text-3xl font-bold tracking-tight mt-1">My followers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {followers.length} {followers.length === 1 ? "person follows" : "people follow"} you
        </p>
      </header>

      {isLoading && (
        <div className="text-sm text-muted-foreground py-12 text-center">Loading followers…</div>
      )}

      {!isLoading && followers.length === 0 && (
        <Card className="bg-card border-card-border">
          <CardContent className="py-12 text-center space-y-2">
            <Users className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No followers yet. Share your profile to get started!</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {followers.map((f) => (
          <Card key={f.id} className="bg-card border-card-border" data-testid={`follower-${f.username}`}>
            <CardContent className="p-4 flex items-center gap-4">
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarFallback
                  style={{ backgroundColor: f.avatarColor }}
                  className="text-white font-semibold"
                >
                  {f.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">@{f.username}</div>
                <div className="text-xs text-muted-foreground">
                  Following you since {formatDistanceToNow(new Date(f.followedAt), { addSuffix: true })}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Link href={`/users/${f.username}`}>
                  <Button variant="outline" size="sm">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                  disabled={remove.isPending}
                  onClick={() => handleRemove(f.username)}
                  data-testid={`button-remove-follower-${f.username}`}
                >
                  <UserMinus className="w-4 h-4 mr-1" /> Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
