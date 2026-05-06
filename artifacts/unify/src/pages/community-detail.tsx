import { useRoute, Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  useGetCommunityDetail,
  useGetCommunityPosts,
  useGetMyProfile,
  useJoinCommunity,
  useLeaveCommunity,
  getGetCommunityDetailQueryKey,
  getGetCommunityPostsQueryKey,
  getListCommunitiesQueryKey,
  getGetMyProfileQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetActivityFeedQueryKey,
} from "@workspace/api-client-react";
import { useAuthenticatedFetch } from "@/lib/api-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Users, Send, MessageSquare } from "lucide-react";
import { PostCard } from "@/components/PostCard";
import { PostComposer } from "@/components/PostComposer";
import { formatDistanceToNow } from "date-fns";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface ChatMessage {
  id: number;
  content: string;
  createdAt: string;
  author: { id: number; username: string; avatarColor: string };
  isOwn: boolean;
}

function CommunityChat({ slug, isMember }: { slug: string; isMember: boolean }) {
  const afetch = useAuthenticatedFetch();
  const [, navigate] = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const r = await afetch(`${BASE}/api/communities/${slug}/chat`);
      if (r.ok) {
        const data = await r.json();
        setMessages(data);
      }
    } catch {
      // silent
    }
  }, [afetch, slug]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);


  async function sendMessage() {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const r = await afetch(`${BASE}/api/communities/${slug}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (r.ok) {
        const msg = await r.json();
        setMessages((prev) => [...prev, msg]);
        setInput("");
      }
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="bg-card border-card-border flex flex-col" style={{ height: "360px" }}>
      <CardHeader className="pb-2 px-4 pt-4 shrink-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" /> Community Chat
        </CardTitle>
      </CardHeader>

      {!isMember ? (
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-xs text-muted-foreground text-center">
            Join this community to chat with members.
          </p>
        </CardContent>
      ) : (
        <>
          <div
            ref={containerRef}
            className="flex-1 overflow-y-auto px-4 space-y-3 py-2"
          >
            {messages.length === 0 && (
              <p className="text-xs text-muted-foreground text-center pt-8">
                No messages yet. Say hello!
              </p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.isOwn ? "flex-row-reverse" : "flex-row"}`}
              >
                <button
                  onClick={() => navigate(`/users/${msg.author.username}`)}
                  className="shrink-0"
                >
                  <Avatar className="w-6 h-6">
                    <AvatarFallback
                      style={{ backgroundColor: msg.author.avatarColor }}
                      className="text-white text-[9px] font-semibold"
                    >
                      {msg.author.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
                <div className={`flex flex-col gap-0.5 max-w-[72%] ${msg.isOwn ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => navigate(`/users/${msg.author.username}`)}
                      className={`text-[10px] text-muted-foreground hover:text-primary transition-colors ${msg.isOwn ? "order-last" : ""}`}
                    >
                      @{msg.author.username}
                    </button>
                    <span className="text-[9px] text-muted-foreground/60">
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div
                    className={`px-3 py-1.5 rounded-2xl text-sm leading-relaxed break-words ${
                      msg.isOwn
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-secondary text-foreground rounded-tl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="px-3 pb-3 pt-2 shrink-0 border-t border-border/50">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type a message…"
                className="text-sm h-8"
                maxLength={500}
              />
              <Button
                size="sm"
                className="h-8 w-8 p-0 shrink-0"
                onClick={sendMessage}
                disabled={!input.trim() || sending}
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

export default function CommunityDetailPage() {
  const [, params] = useRoute("/communities/:slug");
  const slug = params?.slug ?? "";
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  const { data: profile } = useGetMyProfile();
  const { data: community, isLoading } = useGetCommunityDetail(slug);
  const { data: posts = [] } = useGetCommunityPosts(slug);
  const join = useJoinCommunity();
  const leave = useLeaveCommunity();

  function invalidate() {
    qc.invalidateQueries({ queryKey: getGetCommunityDetailQueryKey(slug) });
    qc.invalidateQueries({ queryKey: getGetCommunityPostsQueryKey(slug) });
    qc.invalidateQueries({ queryKey: getListCommunitiesQueryKey() });
    qc.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
    qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    qc.invalidateQueries({ queryKey: getGetActivityFeedQueryKey() });
  }

  if (isLoading) {
    return (
      <div className="p-8 text-sm text-muted-foreground">Loading community…</div>
    );
  }
  if (!community) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-4">
        <Link
          href="/communities"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to communities
        </Link>
        <Card className="bg-card border-card-border">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            That community doesn't exist (or you don't have access).
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <Link
        href="/communities"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        data-testid="link-back-communities"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> My communities
      </Link>

      <Card
        className="bg-card border-card-border overflow-hidden"
        data-testid={`card-community-detail-${community.slug}`}
      >
        <div className="h-2" style={{ backgroundColor: community.accentColor }} />
        <div className="p-6 flex items-start gap-5 flex-wrap">
          {community.imageUrl ? (
            <img
              src={community.imageUrl}
              alt={community.name}
              className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0"
              style={{ backgroundColor: community.accentColor }}
            >
              {community.name[0]}
            </div>
          )}
          <div className="flex-1 min-w-[240px] space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {community.name}
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              {community.description}
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {community.tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-full bg-secondary text-[11px] border border-border"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="text-xs text-muted-foreground pt-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {community.memberCount}{" "}
              {community.memberCount === 1 ? "member" : "members"}
            </div>
          </div>
          <Button
            size="lg"
            variant={community.isMember ? "secondary" : "default"}
            disabled={join.isPending || leave.isPending}
            onClick={async () => {
              if (community.isMember) {
                await leave.mutateAsync({ id: community.id });
              } else {
                await join.mutateAsync({ id: community.id });
              }
              invalidate();
            }}
            data-testid="button-toggle-membership"
          >
            {community.isMember ? "Leave community" : "Join +5 coins"}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Chat box above posts */}
          <CommunityChat slug={community.slug} isMember={community.isMember} />

          {community.isMember && <PostComposer communitySlug={community.slug} />}
          {!community.isMember && (
            <Card className="bg-card border-card-border">
              <CardContent className="py-6 text-sm text-muted-foreground text-center">
                Join this community to start posting and reading the room.
              </CardContent>
            </Card>
          )}
          <h2 className="text-sm uppercase tracking-widest text-muted-foreground pt-2">
            Recent posts
          </h2>
          {posts.length === 0 && (
            <Card className="bg-card border-card-border">
              <CardContent className="py-10 text-sm text-muted-foreground text-center">
                No posts yet. Be the first to share something.
              </CardContent>
            </Card>
          )}
          {posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              currentUsername={profile?.username}
            />
          ))}
        </div>

        <Card className="bg-card border-card-border h-fit">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Members
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {community.members.length === 0 && (
              <div className="text-sm text-muted-foreground py-4 text-center">
                No members yet — be the first.
              </div>
            )}
            {community.members.map((m) => (
              <button
                key={m.id}
                onClick={() => navigate(`/users/${m.username}`)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent/10 transition-colors text-left"
                data-testid={`member-${m.username}`}
              >
                <Avatar className="w-9 h-9">
                  <AvatarFallback
                    style={{ backgroundColor: m.avatarColor }}
                    className="text-white text-xs font-semibold"
                  >
                    {m.username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    @{m.username}
                  </div>
                  {m.bio && (
                    <div className="text-xs text-muted-foreground truncate">
                      {m.bio}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
