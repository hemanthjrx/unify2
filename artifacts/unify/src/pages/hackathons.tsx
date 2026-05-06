import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuthenticatedFetch } from "@/lib/api-fetch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
  Zap, MapPin, Users, Calendar, Plus, X, Trash2, Heart, Tag, MessageCircle,
} from "lucide-react";
import { PhotoUploader, photosToObjectPaths, objectPathsToPhotos, type UploadedPhoto } from "@/components/PhotoUploader";
import { ReportButton } from "@/components/ReportModal";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface HackathonPost {
  id: number;
  body: string;
  hackathonDate: string | null;
  hackathonLocation: string | null;
  hackathonTeamSize: number | null;
  hackathonSkills: string[];
  hackathonFilled: boolean;
  images: string[];
  createdAt: string;
  author: { id: number; username: string; avatarColor: string };
  likeCount: number;
  isLiked: boolean;
  isOwner: boolean;
}

export default function HackathonsPage() {
  const afetch = useAuthenticatedFetch();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [posts, setPosts] = useState<HackathonPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "mine">("all");

  const [form, setForm] = useState({
    body: "",
    hackathonDate: "",
    hackathonLocation: "",
    hackathonTeamSize: "",
    skillInput: "",
    hackathonSkills: [] as string[],
  });
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);

  const loadPosts = useCallback(async () => {
    try {
      const r = await afetch(`${BASE}/api/hackathons`);
      const data = await r.json();
      setPosts(data);
    } catch {
      toast({ title: "Failed to load hackathons", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [afetch, toast]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  function addSkill() {
    const s = form.skillInput.trim();
    if (!s || form.hackathonSkills.includes(s) || form.hackathonSkills.length >= 10) return;
    setForm((f) => ({ ...f, hackathonSkills: [...f.hackathonSkills, s], skillInput: "" }));
  }

  async function submit() {
    if (form.body.trim().length < 3) {
      toast({ title: "Please describe the hackathon first", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const r = await afetch(`${BASE}/api/hackathons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: form.body.trim(),
          hackathonDate: form.hackathonDate || undefined,
          hackathonLocation: form.hackathonLocation.trim() || undefined,
          hackathonTeamSize: form.hackathonTeamSize ? Number(form.hackathonTeamSize) : undefined,
          hackathonSkills: form.hackathonSkills,
          images: photosToObjectPaths(photos),
        }),
      });
      if (!r.ok) throw new Error();
      const newPost = await r.json();
      setPosts((p) => [newPost, ...p]);
      setForm({ body: "", hackathonDate: "", hackathonLocation: "", hackathonTeamSize: "", skillInput: "", hackathonSkills: [] });
      setPhotos([]);
      setShowComposer(false);
      toast({ title: "Hackathon invite posted!" });
    } catch {
      toast({ title: "Failed to post", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleLike(post: HackathonPost) {
    const method = post.isLiked ? "DELETE" : "POST";
    const r = await afetch(`${BASE}/api/hackathons/${post.id}/like`, { method });
    if (!r.ok) return;
    const { likeCount, isLiked } = await r.json();
    setPosts((ps) => ps.map((p) => p.id === post.id ? { ...p, likeCount, isLiked } : p));
  }

  async function deletePost(id: number) {
    const r = await afetch(`${BASE}/api/hackathons/${id}`, { method: "DELETE" });
    if (!r.ok) return;
    setPosts((ps) => ps.filter((p) => p.id !== id));
    toast({ title: "Post deleted" });
  }

  async function toggleStatus(post: HackathonPost) {
    const r = await afetch(`${BASE}/api/hackathons/${post.id}/status`, { method: "PATCH" });
    if (!r.ok) return;
    const { hackathonFilled } = await r.json();
    setPosts((ps) => ps.map((p) => p.id === post.id ? { ...p, hackathonFilled } : p));
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      {/* Sticky header with Post Invite button */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-4 -mt-4 -mx-6 px-6 border-b border-border/50 mb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-400" /> Hackathons
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Find teammates, share invites, build together.</p>
          </div>
          <Button
            size="lg"
            onClick={() => setShowComposer((v) => !v)}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25"
          >
            <Plus className="w-4 h-4" />
            Post Invite
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === "all"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All Invites
        </button>
        <button
          onClick={() => setActiveTab("mine")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === "mine"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          My Invites
          {posts.filter((p) => p.isOwner).length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold leading-none">
              {posts.filter((p) => p.isOwner).length}
            </span>
          )}
        </button>
      </div>

      {/* Composer */}
      {showComposer && (
        <Card className="bg-card border-card-border ring-2 ring-primary/30">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <span className="font-semibold text-sm">New Hackathon Invite</span>
            <button onClick={() => setShowComposer(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Textarea
                placeholder="Describe the hackathon, what you're building, and what kind of teammates you're looking for…"
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                rows={4}
                className="bg-secondary border-border resize-none"
              />
              {form.body.trim().length > 0 && form.body.trim().length < 3 && (
                <p className="text-xs text-destructive mt-1">
                  {3 - form.body.trim().length} more character{3 - form.body.trim().length !== 1 ? "s" : ""} needed
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Event Date</label>
                <Input
                  type="date"
                  value={form.hackathonDate}
                  onChange={(e) => setForm((f) => ({ ...f, hackathonDate: e.target.value }))}
                  className="bg-secondary border-border text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Location / Mode</label>
                <Input
                  placeholder="Online / Bengaluru / MIT"
                  value={form.hackathonLocation}
                  onChange={(e) => setForm((f) => ({ ...f, hackathonLocation: e.target.value }))}
                  className="bg-secondary border-border text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Team Size Needed</label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  placeholder="e.g. 3"
                  value={form.hackathonTeamSize}
                  onChange={(e) => setForm((f) => ({ ...f, hackathonTeamSize: e.target.value }))}
                  className="bg-secondary border-border text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Skills Required</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="React, ML…"
                    value={form.skillInput}
                    onChange={(e) => setForm((f) => ({ ...f, skillInput: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    className="bg-secondary border-border text-sm"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addSkill}>Add</Button>
                </div>
              </div>
            </div>
            {form.hackathonSkills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.hackathonSkills.map((s) => (
                  <span key={s} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-medium">
                    {s}
                    <button onClick={() => setForm((f) => ({ ...f, hackathonSkills: f.hackathonSkills.filter((x) => x !== s) }))}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Photos <span className="text-muted-foreground/60">(optional, up to 5)</span></label>
              <PhotoUploader value={photos} onChange={setPhotos} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowComposer(false)}>Cancel</Button>
              <Button size="sm" onClick={submit} disabled={submitting}>
                {submitting ? "Posting…" : "Post Invite"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feed */}
      {loading && (
        <div className="text-center text-muted-foreground py-20 text-sm">Loading hackathons…</div>
      )}

      {!loading && (() => {
        const visible = activeTab === "mine" ? posts.filter((p) => p.isOwner) : posts;
        if (visible.length === 0) return (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
              <Zap className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <p className="font-semibold">
                {activeTab === "mine" ? "You haven't posted any invites yet" : "No hackathon invites yet"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {activeTab === "mine"
                  ? "Post your first hackathon invite and find teammates!"
                  : "Be the first to post a hackathon invite and find teammates!"}
              </p>
            </div>
            <Button onClick={() => setShowComposer(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Post Invite
            </Button>
          </div>
        );
        return null;
      })()}

      <div className="space-y-4">
        {(activeTab === "mine" ? posts.filter((p) => p.isOwner) : posts).map((post) => (
          <Card key={post.id} className="bg-card border-card-border hover:border-primary/30 transition-colors">
            <CardContent className="p-5 space-y-4">
              {/* Author row */}
              <div className="flex items-start justify-between gap-3">
                <button
                  className="flex items-center gap-3 text-left"
                  onClick={() => navigate(`/users/${post.author.username}`)}
                >
                  <Avatar className="w-9 h-9">
                    <AvatarFallback
                      style={{ backgroundColor: post.author.avatarColor }}
                      className="text-white text-sm font-semibold"
                    >
                      {post.author.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm hover:text-primary transition-colors">
                      @{post.author.username}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  {post.isOwner ? (
                    <button
                      onClick={() => toggleStatus(post)}
                      title="Click to toggle filled/unfilled"
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                        post.hackathonFilled
                          ? "bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30"
                      }`}
                    >
                      {post.hackathonFilled ? "● Filled" : "○ Unfilled"}
                    </button>
                  ) : (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                      post.hackathonFilled
                        ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    }`}>
                      {post.hackathonFilled ? "● Filled" : "○ Unfilled"}
                    </span>
                  )}
                  {post.isOwner && (
                    <button
                      onClick={() => deletePost(post.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Body */}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.body}</p>
              {post.images && post.images.length > 0 && (
                <div className={`grid gap-2 ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                  {post.images.map((path, i) => (
                    <img key={i} src={`${BASE}/api/storage${path}`} alt="" className="rounded-lg object-cover w-full max-h-48" />
                  ))}
                </div>
              )}

              {/* Meta chips */}
              <div className="flex flex-wrap gap-3">
                {post.hackathonDate && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg border border-border">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    {new Date(post.hackathonDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                )}
                {post.hackathonLocation && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg border border-border">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    {post.hackathonLocation}
                  </div>
                )}
                {post.hackathonTeamSize && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg border border-border">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    {post.hackathonTeamSize} members needed
                  </div>
                )}
              </div>

              {/* Skills */}
              {post.hackathonSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  {post.hackathonSkills.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer: like + message + report */}
              <div className="flex items-center justify-between pt-1 border-t border-border/50">
                <button
                  onClick={() => toggleLike(post)}
                  className={`flex items-center gap-1.5 text-xs transition-colors ${
                    post.isLiked ? "text-rose-400" : "text-muted-foreground hover:text-rose-400"
                  }`}
                >
                  <Heart className="w-4 h-4" fill={post.isLiked ? "currentColor" : "none"} />
                  {post.likeCount} {post.likeCount === 1 ? "like" : "likes"}
                </button>

                <div className="flex items-center gap-2">
                  {!post.isOwner && (
                    <>
                      <ReportButton targetType="hackathon" targetId={post.id} label="this invite" />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5 border-sky-500/50 text-sky-400 hover:bg-sky-500/10 hover:text-sky-300"
                        onClick={() => navigate(`/messages/${post.author.username}`)}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Message @{post.author.username}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
