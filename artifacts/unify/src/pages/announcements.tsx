import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Heart, MessageCircle, Send, Trash2, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useGetMyProfile } from "@workspace/api-client-react";
import { useAuthenticatedFetch } from "@/lib/api-fetch";
import { PhotoUploader, photosToObjectPaths, objectPathsToPhotos, type UploadedPhoto } from "@/components/PhotoUploader";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface AnnouncementComment {
  id: number;
  body: string;
  createdAt: string;
  author: { username: string; avatarColor: string | null };
}

interface Announcement {
  id: number;
  title: string;
  body: string;
  images: string[];
  createdAt: string;
  author: { username: string; avatarColor: string | null };
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
}

function useApiFetch() {
  const authFetch = useAuthenticatedFetch();
  return {
    get: async (path: string) => {
      const res = await authFetch(`${BASE}/api${path}`);
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
    post: async (path: string, body: unknown) => {
      const res = await authFetch(`${BASE}/api${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      return res.status === 204 ? null : res.json();
    },
    del: async (path: string) => {
      const res = await authFetch(`${BASE}/api${path}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error(`${res.status}`);
    },
  };
}

function AnnouncementCard({ item, isAdmin }: { item: Announcement; isAdmin: boolean }) {
  const api = useApiFetch();
  const qc = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const { data: comments = [] } = useQuery<AnnouncementComment[]>({
    queryKey: ["announcement-comments", item.id],
    queryFn: () => api.get(`/announcements/${item.id}/comments`),
    enabled: showComments,
  });

  const likeMutation = useMutation({
    mutationFn: () =>
      item.isLiked
        ? api.del(`/announcements/${item.id}/like`)
        : api.post(`/announcements/${item.id}/like`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });

  const commentMutation = useMutation({
    mutationFn: () => api.post(`/announcements/${item.id}/comments`, { body: commentText.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcement-comments", item.id] });
      qc.invalidateQueries({ queryKey: ["announcements"] });
      setCommentText("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.del(`/announcements/${item.id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden">
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-card-border px-5 py-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 mt-0.5">
            <Megaphone className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-base leading-tight">{item.title}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Posted by{" "}
              <span className="font-medium text-foreground">@{item.author.username}</span>{" "}
              · {new Date(item.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
            </div>
          </div>
        </div>
        {isAdmin && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive flex-shrink-0"
            onClick={() => { if (confirm("Delete this announcement?")) deleteMutation.mutate(); }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      <div className="px-5 py-4 space-y-4">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.body}</p>
        {item.images && item.images.length > 0 && (
          <div className={`grid gap-2 ${item.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {item.images.map((path, i) => (
              <img
                key={i}
                src={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/storage${path}`}
                alt=""
                className="rounded-lg object-cover w-full max-h-64"
              />
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 pt-1 border-t border-border">
          <button
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              item.isLiked ? "text-red-400" : "text-muted-foreground hover:text-red-400"
            }`}
          >
            <Heart className={`w-4 h-4 ${item.isLiked ? "fill-current" : ""}`} />
            <span>{item.likeCount}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{item.commentCount}</span>
            {showComments ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showComments && (
          <div className="space-y-3 pt-1">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2.5">
                <Avatar className="w-7 h-7 flex-shrink-0">
                  <AvatarFallback
                    style={{ backgroundColor: c.author.avatarColor ?? "#7c5cff" }}
                    className="text-white text-xs font-bold"
                  >
                    {c.author.username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="bg-secondary rounded-xl px-3 py-2 flex-1 min-w-0">
                  <div className="text-xs font-semibold text-foreground">@{c.author.username}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{c.body}</div>
                </div>
              </div>
            ))}
            <div className="flex gap-2.5">
              <Textarea
                placeholder="Write a comment…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={1}
                className="resize-none text-sm flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && commentText.trim()) {
                    e.preventDefault();
                    commentMutation.mutate();
                  }
                }}
              />
              <Button
                size="sm"
                className="px-3"
                disabled={!commentText.trim() || commentMutation.isPending}
                onClick={() => commentMutation.mutate()}
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CreateAnnouncementForm({ onClose }: { onClose: () => void }) {
  const api = useApiFetch();
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", body: "" });
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);

  const createMutation = useMutation({
    mutationFn: () => api.post("/announcements", { ...form, images: photosToObjectPaths(photos) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      onClose();
    },
  });

  return (
    <div className="bg-card border border-primary/40 rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-sm flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-primary" />
          New Announcement
        </div>
        <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Title</label>
        <Input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Important update…"
          className="text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Message</label>
        <Textarea
          value={form.body}
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          rows={4}
          placeholder="Write your announcement here…"
          className="text-sm resize-none"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Photos (optional)</label>
        <PhotoUploader value={photos} onChange={setPhotos} />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button
          size="sm"
          disabled={!form.title.trim() || !form.body.trim() || createMutation.isPending}
          onClick={() => createMutation.mutate()}
        >
          {createMutation.isPending ? "Posting…" : "Post Announcement"}
        </Button>
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  const api = useApiFetch();
  const { data: profile } = useGetMyProfile();
  const [showForm, setShowForm] = useState(false);
  const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ["announcements"],
    queryFn: () => api.get("/announcements"),
  });

  const isAdmin = profile?.role === "admin";

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Announcements</h1>
            <p className="text-sm text-muted-foreground">Official updates from the admin team</p>
          </div>
        </div>
        {isAdmin && !showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Post
          </Button>
        )}
      </div>

      {showForm && <CreateAnnouncementForm onClose={() => setShowForm(false)} />}

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading announcements…</div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <Megaphone className="w-10 h-10 text-muted-foreground/40" />
          <div className="text-muted-foreground text-sm">No announcements yet.</div>
          {isAdmin && <div className="text-xs text-muted-foreground">Post your first announcement above.</div>}
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <AnnouncementCard key={a.id} item={a} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </div>
  );
}
