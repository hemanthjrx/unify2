import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreatePost,
  getGetPostsFeedQueryKey,
  getGetCommunityPostsQueryKey,
  getGetUserPostsQueryKey,
  getGetMyProfileQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetActivityFeedQueryKey,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Coins, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PhotoUploader, photosToObjectPaths, type UploadedPhoto } from "@/components/PhotoUploader";

const MAX = 600;

export function PostComposer({
  communitySlug,
  placeholder,
}: {
  communitySlug?: string;
  placeholder?: string;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const create = useCreatePost();

  const remaining = MAX - body.length;
  const tooLong = remaining < 0;
  const empty = body.trim().length === 0;

  async function submit() {
    if (empty || tooLong || create.isPending) return;
    try {
      await create.mutateAsync({
        data: {
          body: body.trim(),
          communitySlug: communitySlug ?? null,
          images: photosToObjectPaths(photos),
        } as Parameters<typeof create.mutateAsync>[0]["data"],
      });
      setBody("");
      setPhotos([]);
      qc.invalidateQueries({ queryKey: getGetPostsFeedQueryKey() });
      if (communitySlug) {
        qc.invalidateQueries({
          queryKey: getGetCommunityPostsQueryKey(communitySlug),
        });
      }
      qc.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
      qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      qc.invalidateQueries({ queryKey: getGetActivityFeedQueryKey() });
      // user posts will refetch when visited
      qc.invalidateQueries({
        predicate: (q) => {
          const k = q.queryKey?.[0];
          return typeof k === "string" && k.startsWith("/api/posts/user/");
        },
      });
      toast({
        title: "Posted!",
        description: "+2 coins for sharing with your network.",
      });
    } catch (e) {
      toast({
        title: "Could not post",
        description: e instanceof Error ? e.message : "Try again in a moment.",
        variant: "destructive",
      });
    }
  }

  return (
    <Card className="bg-card border-card-border p-5 space-y-3">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={
          placeholder ??
          (communitySlug
            ? "Share something with this community…"
            : "What's on your mind today?")
        }
        rows={3}
        className="resize-none bg-background/40 border-border/60"
        data-testid="textarea-post-body"
      />
      <PhotoUploader value={photos} onChange={setPhotos} />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-yellow-400">
            <Coins className="w-3.5 h-3.5" /> +2 coins per post
          </span>
          <span
            className={
              tooLong
                ? "text-destructive font-medium"
                : remaining < 60
                  ? "text-amber-400"
                  : "text-muted-foreground"
            }
          >
            {remaining}
          </span>
        </div>
        <Button
          onClick={submit}
          disabled={empty || tooLong || create.isPending}
          data-testid="button-submit-post"
        >
          <Send className="w-4 h-4 mr-2" />
          {create.isPending ? "Posting…" : "Post"}
        </Button>
      </div>
    </Card>
  );
}
