import {
  useDiscoverPeople,
  useDiscoverCommunities,
  useFollowUser,
  useUnfollowUser,
  useJoinCommunity,
  useLeaveCommunity,
  getDiscoverPeopleQueryKey,
  getDiscoverCommunitiesQueryKey,
  getGetActivityFeedQueryKey,
  getGetMyProfileQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Coins, UserPlus, UserCheck, Users, Sparkles, Compass, ArrowRight } from "lucide-react";

export default function DiscoverPage() {
  const qc = useQueryClient();
  const { data: people = [] } = useDiscoverPeople();
  const { data: communities = [] } = useDiscoverCommunities();

  const follow = useFollowUser();
  const unfollow = useUnfollowUser();
  const join = useJoinCommunity();
  const leave = useLeaveCommunity();

  function invalidatePeople() {
    qc.invalidateQueries({ queryKey: getDiscoverPeopleQueryKey() });
    qc.invalidateQueries({ queryKey: getGetActivityFeedQueryKey() });
    qc.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
  }

  function invalidateCommunities() {
    qc.invalidateQueries({ queryKey: getDiscoverCommunitiesQueryKey() });
    qc.invalidateQueries({ queryKey: getGetActivityFeedQueryKey() });
    qc.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
    qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <header>
        <div className="flex items-center gap-2 text-primary text-sm font-medium uppercase tracking-widest">
          <Compass className="w-4 h-4" /> Discover
        </div>
        <h1 className="text-3xl font-bold tracking-tight mt-1">
          Find your people
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Recommendations based on your interests and skills.
        </p>
      </header>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Suggested students
          </h2>
          <span className="text-xs text-muted-foreground">{people.length} matches</span>
        </div>
        {people.length === 0 ? (
          <Card className="bg-card border-card-border">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No suggestions yet — add a few interests on your profile to power
              the matchmaker.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {people.map((p) => (
              <Card key={p.id} className="bg-card border-card-border" data-testid={`card-person-${p.username}`}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback
                        style={{ backgroundColor: p.avatarColor }}
                        className="text-white font-semibold"
                      >
                        {p.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">@{p.username}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {p.bio || "Student on Unify."}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Coins className="w-3 h-3 text-yellow-400" />
                      {p.coins}
                    </div>
                  </div>

                  {p.sharedInterests.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Shared interests
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {p.sharedInterests.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[11px] border border-primary/20"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {p.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {p.skills.slice(0, 4).map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded-full bg-secondary text-[11px] border border-border"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant={p.isFollowing ? "secondary" : "default"}
                      className="flex-1"
                      data-testid={`button-follow-${p.username}`}
                      disabled={follow.isPending || unfollow.isPending}
                      onClick={async () => {
                        if (p.isFollowing) {
                          await unfollow.mutateAsync({ username: p.username });
                        } else {
                          await follow.mutateAsync({ username: p.username });
                        }
                        invalidatePeople();
                      }}
                    >
                      {p.isFollowing ? (
                        <>
                          <UserCheck className="w-4 h-4 mr-2" /> Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" /> Follow
                        </>
                      )}
                    </Button>
                    <Link href={`/users/${p.username}`}>
                      <Button variant="outline" data-testid={`button-view-${p.username}`}>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Communities for you
          </h2>
        </div>
        {communities.length === 0 ? (
          <Card className="bg-card border-card-border">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No matches yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {communities.map((c) => (
              <Card
                key={c.id}
                className="bg-card border-card-border overflow-hidden"
                data-testid={`card-community-${c.slug}`}
              >
                <div className="h-1.5" style={{ backgroundColor: c.accentColor }} />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{c.name}</CardTitle>
                      <div className="text-xs text-muted-foreground mt-1">
                        {c.memberCount} {c.memberCount === 1 ? "member" : "members"}
                      </div>
                    </div>
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: c.accentColor }}
                    >
                      {c.name[0]}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pb-5">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {c.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {c.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-full bg-secondary text-[11px] border border-border"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={c.isMember ? "secondary" : "default"}
                      className="flex-1"
                      data-testid={`button-join-${c.slug}`}
                      disabled={join.isPending || leave.isPending}
                      onClick={async () => {
                        if (c.isMember) {
                          await leave.mutateAsync({ id: c.id });
                        } else {
                          await join.mutateAsync({ id: c.id });
                        }
                        invalidateCommunities();
                      }}
                    >
                      {c.isMember ? "Leave" : "Join +5 coins"}
                    </Button>
                    <Link href={`/communities/${c.slug}`}>
                      <Button variant="outline">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
