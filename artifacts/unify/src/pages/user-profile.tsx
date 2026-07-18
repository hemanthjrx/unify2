import { useRoute, Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetUserProfile,
  useGetUserPosts,
  useGetMyProfile,
  useFollowUser,
  useUnfollowUser,
  getGetUserProfileQueryKey,
  getGetUserPostsQueryKey,
  getDiscoverPeopleQueryKey,
  getGetActivityFeedQueryKey,
  getGetMyProfileQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { useAuthenticatedFetch } from "@/lib/api-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Coins, Users, UserCheck, UserPlus, UserMinus, Clock, MessageCircle, Lock, Globe, ExternalLink, Linkedin, Github } from "lucide-react";
import { PostCard } from "@/components/PostCard";
import { useState, useEffect } from "react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type FollowStatus = "none" | "pending" | "accepted";

export default function UserProfilePage() {
  const [, params] = useRoute("/users/:username");
  const [, navigate] = useLocation();
  const username = params?.username ?? "";
  const qc = useQueryClient();
  const afetch = useAuthenticatedFetch();
  const { toast } = useToast();

  const { data: me } = useGetMyProfile();
  const { data: user, isLoading } = useGetUserProfile(username);
  const { data: posts = [] } = useGetUserPosts(username);
  const follow = useFollowUser();
  const unfollow = useUnfollowUser();

  const isMe = me?.username === username;
  const [followStatus, setFollowStatus] = useState<FollowStatus>("none");
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    // Derive initial follow status from the generated hook data (extra fields pass through)
    const raw = user as (typeof user & { followStatus?: FollowStatus }) | undefined;
    if (raw?.followStatus) {
      setFollowStatus(raw.followStatus);
    } else if (raw?.isFollowing) {
      setFollowStatus("accepted");
    } else {
      setFollowStatus("none");
    }
  }, [user]);

  function invalidate() {
    qc.invalidateQueries({ queryKey: getGetUserProfileQueryKey(username) });
    qc.invalidateQueries({ queryKey: getGetUserPostsQueryKey(username) });
    qc.invalidateQueries({ queryKey: getDiscoverPeopleQueryKey() });
    qc.invalidateQueries({ queryKey: getGetActivityFeedQueryKey() });
    qc.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
    qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
  }

  async function handleFollow() {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      const r = await afetch(`${BASE}/api/connections/${username}/follow`, { method: "POST" });
      if (!r.ok) throw new Error();
      const data = await r.json();
      const raw = data as { followStatus?: FollowStatus; isFollowing?: boolean };
      setFollowStatus(raw.followStatus ?? (raw.isFollowing ? "accepted" : "none"));
      invalidate();
      if (raw.followStatus === "pending") {
        toast({ title: "Follow request sent!" });
      } else {
        toast({ title: `Now following @${username}` });
      }
    } catch {
      toast({ title: "Action failed", variant: "destructive" });
    } finally {
      setFollowLoading(false);
    }
  }

  async function handleUnfollow() {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      await unfollow.mutateAsync({ username });
      setFollowStatus("none");
      invalidate();
    } catch {
      toast({ title: "Action failed", variant: "destructive" });
    } finally {
      setFollowLoading(false);
    }
  }

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Loading profile…</div>;

  if (!user) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-4">
        <Link href="/discover" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Link>
        <Card className="bg-card border-card-border">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">That user doesn't exist on Unify.</CardContent>
        </Card>
      </div>
    );
  }

  const isPrivate = (user as typeof user & { isPrivate?: boolean })?.isPrivate;

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <Link href="/discover" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground" data-testid="link-back-discover">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Link>

      <Card className="bg-card border-card-border overflow-hidden" data-testid={`card-user-${user.username}`}>
        <div className="h-24 w-full" style={{ background: `linear-gradient(135deg, ${user.avatarColor}33, #1a1040)` }} />
        <CardContent className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <Avatar className="w-20 h-20 ring-4 ring-card">
              <AvatarFallback style={{ backgroundColor: user.avatarColor }} className="text-white text-2xl font-bold">
                {user.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {!isMe && (
              <div className="flex items-center gap-2">
                {/* Message button — visible to all users */}
                <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate(`/messages/${username}`)}>
                  <MessageCircle className="w-4 h-4" /> Message
                </Button>

                {/* Follow button */}
                {followStatus === "accepted" ? (
                  <Button variant="outline" size="sm" onClick={handleUnfollow} disabled={followLoading} className="gap-2" data-testid="button-unfollow">
                    <UserMinus className="w-4 h-4" /> Unfollow
                  </Button>
                ) : followStatus === "pending" ? (
                  <Button variant="outline" size="sm" disabled className="gap-2 text-amber-400 border-amber-400/30">
                    <Clock className="w-4 h-4" /> Requested
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleFollow} disabled={followLoading} className="gap-2" data-testid="button-follow">
                    {isPrivate ? <UserPlus className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    {isPrivate ? "Request to Follow" : "Follow"}
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">@{user.username}</h2>
              {isPrivate && <Lock className="w-4 h-4 text-muted-foreground" title="Private account" />}
            </div>
            {user.bio && <p className="text-sm text-muted-foreground">{user.bio}</p>}
          </div>

          <div className="flex items-center gap-6 mt-4 flex-wrap">
            <div className="text-center">
              <div className="font-bold text-lg">{user.followerCount}</div>
              <div className="text-xs text-muted-foreground">Followers</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">{user.followingCount}</div>
              <div className="text-xs text-muted-foreground">Following</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">{user.communityCount}</div>
              <div className="text-xs text-muted-foreground">Communities</div>
            </div>

            {/* Social links fill the empty space */}
            {(() => {
              const u = user as typeof user & { portfolioUrl?: string | null; linkedinUrl?: string | null; githubUrl?: string | null };
              return (
                <div className="ml-auto flex items-center gap-2">
                  {u.portfolioUrl ? (
                    <a href={u.portfolioUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium transition-colors">
                      <Globe className="w-3.5 h-3.5" />Portfolio<ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <button onClick={() => toast({ title: `@${user.username} hasn't added a portfolio yet` })}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-secondary text-muted-foreground hover:text-foreground text-xs font-medium transition-colors">
                      <Globe className="w-3.5 h-3.5" />Portfolio
                    </button>
                  )}
                  {u.linkedinUrl ? (
                    <a href={u.linkedinUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-sky-500/40 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 text-xs font-medium transition-colors">
                      <Linkedin className="w-3.5 h-3.5" />LinkedIn<ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <button onClick={() => toast({ title: `@${user.username} hasn't added their LinkedIn yet` })}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-secondary text-muted-foreground hover:text-foreground text-xs font-medium transition-colors">
                      <Linkedin className="w-3.5 h-3.5" />LinkedIn
                    </button>
                  )}
                  {u.githubUrl ? (
                    <a href={u.githubUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs font-medium transition-colors">
                      <Github className="w-3.5 h-3.5" />GitHub<ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <button onClick={() => toast({ title: `@${user.username} hasn't added their GitHub yet` })}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-secondary text-muted-foreground hover:text-foreground text-xs font-medium transition-colors">
                      <Github className="w-3.5 h-3.5" />GitHub
                    </button>
                  )}
                  <div className="flex items-center gap-1 pl-2 border-l border-border">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    <span className="font-semibold text-sm">{user.coins}</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {user.skills && user.skills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {user.skills.map((s) => (
                <span key={s} className="px-2.5 py-1 rounded-full bg-secondary text-xs border border-border">{s}</span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Private account lock screen */}
      {isPrivate && followStatus !== "accepted" && !isMe ? (
        <Card className="bg-card border-card-border">
          <CardContent className="py-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">This account is private</p>
              <p className="text-sm text-muted-foreground mt-1">
                {followStatus === "pending"
                  ? "Your follow request is pending. Posts will be visible once accepted."
                  : "Follow this account to see their posts."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card border-card-border">
          <CardHeader>
            <CardTitle className="text-base">Posts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {posts.length === 0 && (
              <div className="text-sm text-muted-foreground py-6 text-center">No posts yet.</div>
            )}
            {posts.map((p) => (
              <PostCard key={p.id} post={p} currentUsername={me?.username} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
