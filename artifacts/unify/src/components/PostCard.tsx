import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  useLikePost,
  useUnlikePost,
  useDeletePost,
  getGetPostsFeedQueryKey,
  getGetCommunityPostsQueryKey,
  getGetUserPostsQueryKey,
  getGetMyProfileQueryKey,
} from "@workspace/api-client-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Trash2, MessageCircle, Send } from "lucide-react";
import { ReportButton } from "@/components/ReportModal";
import { formatDistanceToNow } from "date-fns";
import { useAuthenticatedFetch } from "@/lib/api-fetch";
import { useQuery, useMutation } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Author = {
  id: number;
  username: string;
  avatarColor: string;
  bio?: string | null;
};
type Community = {
  id: number;
  slug: string;
  name: string;
  accentColor: string;
};
type Post = {
  id: number;
  body: string;
  createdAt: string;
  author: Author;
  community: Community | null;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
};

type Comment = {
  id: number;
  body: string;
  createdAt: string;
  author: { username: string; avatarColor: string };
};

function CommentSection({ postId }: { postId: number }) {
  const afetch = useAuthenticatedFetch();
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ["post-comments", postId],
    queryFn: () => afetch(`${BASE}/api/posts/${postId}/comments`),
  });

  const addComment = useMutation({
    mutationFn: (body: string) =>
      afetch(`${BASE}/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["post-comments", postId] });
      qc.invalidateQueries({ queryKey: getGetPostsFeedQueryKey() });
      setDraft("");
    },
  });

  function submit() {
    const trimmed = draft.trim();
    if (!trimmed || addComment.isPending) return;
    addComment.mutate(trimmed);
  }

  return (
    <div className="space-y-3 pt-2 border-t border-border/40">
      {isLoading && (
        <p className="text-xs text-muted-foreground">Loading…</p>
      )}
      {comments.map((c) => (
        <div key={c.id} className="flex gap-2 items-start">
          <Avatar className="w-6 h-6 shrink-0">
            <AvatarFallback
              style={{ backgroundColor: c.author.avatarColor }}
              className="text-white text-[9px] font-semibold"
            >
              {c.author.username[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 bg-muted/40 rounded-lg px-3 py-2 space-y-0.5">
            <Link
              href={`/users/${c.author.username}`}
              className="text-xs font-semibold hover:text-primary transition-colors"
            >
              @{c.author.username}
            </Link>
            <p className="text-xs text-foreground/90 whitespace-pre-wrap break-words">{c.body}</p>
            <p className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}

      <div className="flex gap-2 items-center">
        <input
          className="flex-1 bg-muted/40 border border-border/50 rounded-full px-3 py-1.5 text-xs outline-none focus:border-primary/60 transition-colors placeholder:text-muted-foreground"
          placeholder="Write a comment…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          maxLength={500}
        />
        <button
          onClick={submit}
          disabled={!draft.trim() || addComment.isPending}
          className="p-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary disabled:opacity-40 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function PostCard({
  post,
  currentUsername,
}: {
  post: Post;
  currentUsername?: string | null;
}) {
  const qc = useQueryClient();
  const like = useLikePost();
  const unlike = useUnlikePost();
  const remove = useDeletePost();
  const [showComments, setShowComments] = useState(false);

  const isMine = currentUsername && post.author.username === currentUsername;

  function invalidate() {
    qc.invalidateQueries({ queryKey: getGetPostsFeedQueryKey() });
    if (post.community) {
      qc.invalidateQueries({
        queryKey: getGetCommunityPostsQueryKey(post.community.slug),
      });
    }
    qc.invalidateQueries({
      queryKey: getGetUserPostsQueryKey(post.author.username),
    });
    qc.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
  }

  return (
    <Card
      className="bg-card border-card-border p-5 space-y-3"
      data-testid={`post-${post.id}`}
    >
      <div className="flex items-start gap-3">
        <Link href={`/users/${post.author.username}`}>
          <Avatar className="w-10 h-10 hover:opacity-80 transition-opacity">
            <AvatarFallback
              style={{ backgroundColor: post.author.avatarColor }}
              className="text-white text-sm font-semibold"
            >
              {post.author.username[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/users/${post.author.username}`}
              className="font-semibold text-sm hover:text-primary transition-colors"
              data-testid={`link-post-author-${post.author.username}`}
            >
              @{post.author.username}
            </Link>
            {post.community && (
              <>
                <span className="text-muted-foreground text-xs">in</span>
                <Link
                  href={`/communities/${post.community.slug}`}
                  className="text-xs px-2 py-0.5 rounded-full border border-border hover:bg-accent/20"
                  style={{ color: post.community.accentColor }}
                  data-testid={`link-post-community-${post.community.slug}`}
                >
                  {post.community.name}
                </Link>
              </>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </div>
        </div>
        {isMine && (
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            disabled={remove.isPending}
            onClick={async () => {
              await remove.mutateAsync({ id: post.id });
              invalidate();
            }}
            data-testid={`button-delete-${post.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
        {post.body}
      </p>

      <div className="flex items-center gap-1 pt-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={like.isPending || unlike.isPending}
          onClick={async () => {
            if (post.isLiked) {
              await unlike.mutateAsync({ id: post.id });
            } else {
              await like.mutateAsync({ id: post.id });
            }
            invalidate();
          }}
          className={
            post.isLiked
              ? "text-pink-400 hover:text-pink-500"
              : "text-muted-foreground hover:text-pink-400"
          }
          data-testid={`button-like-${post.id}`}
        >
          <Heart
            className={`w-4 h-4 mr-1.5 ${post.isLiked ? "fill-current" : ""}`}
          />
          {post.likeCount}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={showComments ? "text-primary" : "text-muted-foreground hover:text-primary"}
          onClick={() => setShowComments((v) => !v)}
          data-testid={`button-comment-${post.id}`}
        >
          <MessageCircle className="w-4 h-4 mr-1.5" />
          {post.commentCount ?? 0}
        </Button>
        {!isMine && (
          <div className="ml-auto">
            <ReportButton targetType="post" targetId={post.id} label="this post" />
          </div>
        )}
      </div>

      {showComments && <CommentSection postId={post.id} />}
    </Card>
  );
}
