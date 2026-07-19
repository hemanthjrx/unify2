import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  useListCommunities,
  useJoinCommunity,
  useLeaveCommunity,
  getListCommunitiesQueryKey,
  getGetMyProfileQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetActivityFeedQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, ArrowRight, Plus } from "lucide-react";

export default function CommunitiesPage() {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [showMyOnly, setShowMyOnly] = useState(true);
  const { data: communities = [] } = useListCommunities();
  const join = useJoinCommunity();
  const leave = useLeaveCommunity();

  const filtered = communities.filter((c) => {
    if (showMyOnly && !c.isMember) return false;
    const q = query.toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: getListCommunitiesQueryKey() });
    qc.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
    qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    qc.invalidateQueries({ queryKey: getGetActivityFeedQueryKey() });
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-primary text-sm font-medium uppercase tracking-widest">
          <Users className="w-4 h-4" /> Communities
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {showMyOnly ? "My communities" : "All communities"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {showMyOnly
                ? "Communities you've joined"
                : "Pick the rooms where you want to show up. Joining earns coins."}
            </p>
          </div>
          {showMyOnly && (
            <Button
              onClick={() => setShowMyOnly(false)}
              variant="default"
              className="gap-2"
            >
              <Plus className="w-4 h-4" /> Join Communities
            </Button>
          )}
          {!showMyOnly && (
            <Button
              onClick={() => setShowMyOnly(true)}
              variant="outline"
            >
              Back to My Communities
            </Button>
          )}
        </div>
      </header>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, tag, or topic"
          className="pl-9"
          data-testid="input-search-communities"
        />
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <Card
            key={c.id}
            className="bg-card border-card-border overflow-hidden flex flex-col"
            data-testid={`card-community-list-${c.slug}`}
          >
            {c.bannerImageUrl ? (
              <div className="h-24 w-full overflow-hidden">
                <img src={c.bannerImageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="h-2" style={{ backgroundColor: c.accentColor }} />
            )}
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <div className="text-xs text-muted-foreground mt-1">
                    {c.memberCount} {c.memberCount === 1 ? "member" : "members"}
                  </div>
                </div>
                {(c.profileImageUrl || c.imageUrl) ? (
                  <img
                    src={(c.profileImageUrl || c.imageUrl)!}
                    alt={c.name}
                    className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                    style={{ backgroundColor: c.accentColor }}
                  >
                    {c.name[0]}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pb-5 flex-1 flex flex-col">
              <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                {c.description}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {c.tags.slice(0, 4).map((t) => (
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
                  disabled={join.isPending || leave.isPending}
                  className="flex-1"
                  onClick={async () => {
                    if (c.isMember) {
                      await leave.mutateAsync({ id: c.id });
                    } else {
                      await join.mutateAsync({ id: c.id });
                    }
                    invalidate();
                  }}
                  data-testid={`button-toggle-${c.slug}`}
                >
                  {c.isMember ? "Leave" : "Join +5 coins"}
                </Button>
                <Link href={`/communities/${c.slug}`}>
                  <Button
                    variant="outline"
                    data-testid={`button-open-${c.slug}`}
                  >
                    Open <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="bg-card border-card-border col-span-full">
            <CardContent className="py-10 text-center text-sm text-muted-foreground space-y-3">
              <p>
                {showMyOnly
                  ? "You haven't joined any communities yet."
                  : `No communities match "${query}".`}
              </p>
              {showMyOnly && (
                <Button
                  onClick={() => setShowMyOnly(false)}
                  variant="default"
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" /> Join Your First Community
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
