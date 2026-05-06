import { useRoute, useLocation, Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { useAuthenticatedFetch } from "@/lib/api-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Plus,
  ArrowLeft,
  MessageSquare,
  CheckCircle,
  ThumbsUp,
  Clock,
  Tag,
  Trash2,
  Send,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Author {
  id: number;
  username: string;
  avatarColor: string;
}

interface Question {
  id: number;
  title: string;
  body: string;
  tags: string[];
  isSolved: boolean;
  createdAt: string;
  replyCount: number;
  author: Author;
  isOwn: boolean;
}

interface Reply {
  id: number;
  content: string;
  isHelpful: boolean;
  createdAt: string;
  author: Author;
  isOwn: boolean;
}

interface QuestionDetail extends Question {
  replies: Reply[];
}

function AvatarBubble({ author, size = "sm" }: { author: Author; size?: "sm" | "md" }) {
  const sz = size === "md" ? "w-9 h-9" : "w-7 h-7";
  const txt = size === "md" ? "text-xs" : "text-[10px]";
  return (
    <Avatar className={sz}>
      <AvatarFallback
        style={{ backgroundColor: author.avatarColor }}
        className={`text-white font-semibold ${txt}`}
      >
        {author.username[0]?.toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

// ─── Question list ──────────────────────────────────────────────────────────
function QuestionList() {
  const afetch = useAuthenticatedFetch();
  const [, navigate] = useLocation();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "solved">("all");

  async function load() {
    try {
      const r = await afetch(`${BASE}/api/mentorship`);
      if (r.ok) setQuestions(await r.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function submit() {
    if (submitting) return;
    if (!title.trim()) { alert("Please enter a question title."); return; }
    if (!body.trim()) { alert("Please describe your question."); return; }
    setSubmitting(true);
    try {
      const r = await afetch(`${BASE}/api/mentorship`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), tags }),
      });
      if (r.ok) {
        setTitle(""); setBody(""); setTags([]); setTagInput("");
        setShowForm(false);
        load();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteQuestion(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this question?")) return;
    await afetch(`${BASE}/api/mentorship/${id}`, { method: "DELETE" });
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags((prev) => [...prev, t]);
    }
    setTagInput("");
  }

  const filtered = questions.filter((q) => {
    if (filter === "open") return !q.isSolved;
    if (filter === "solved") return q.isSolved;
    return true;
  });

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" /> Mentorship
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ask questions, get answers from peers. Mark helpful replies to reward them 5 coins.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Ask a Question
        </Button>
      </div>

      {/* New question form */}
      {showForm && (
        <Card className="bg-card border-card-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Post your question</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Title — what's your question?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
            <Textarea
              placeholder="Describe your question in detail…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              maxLength={2000}
              className="resize-none"
            />
            {/* Tags */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag (e.g. react, dsa, career)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  className="text-sm"
                />
                <Button variant="outline" size="sm" onClick={addTag} disabled={!tagInput.trim() || tags.length >= 5}>
                  <Tag className="w-3.5 h-3.5" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <Badge key={t} variant="secondary" className="gap-1 text-xs pr-1">
                      {t}
                      <button onClick={() => setTags((prev) => prev.filter((x) => x !== t))}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                onClick={submit}
                disabled={submitting}
                className="gap-2"
              >
                <Send className="w-3.5 h-3.5" /> Post Question
              </Button>
              <Button variant="ghost" onClick={() => { setShowForm(false); setTitle(""); setBody(""); setTags([]); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "open", "solved"] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      {/* List */}
      {loading && (
        <p className="text-sm text-muted-foreground py-12 text-center">Loading questions…</p>
      )}
      {!loading && filtered.length === 0 && (
        <Card className="bg-card border-card-border">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No questions here yet. Be the first to ask!
          </CardContent>
        </Card>
      )}
      {filtered.map((q) => (
        <Card
          key={q.id}
          className="bg-card border-card-border hover:border-primary/40 transition-colors cursor-pointer"
          onClick={() => navigate(`/mentorship/${q.id}`)}
        >
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/users/${q.author.username}`); }}
              >
                <AvatarBubble author={q.author} size="md" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-base leading-snug line-clamp-2">{q.title}</h3>
                  <div className="flex items-center gap-1 shrink-0">
                    {q.isSolved && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1 text-[10px]">
                        <CheckCircle className="w-3 h-3" /> Solved
                      </Badge>
                    )}
                    {q.isOwn && (
                      <button
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded"
                        onClick={(e) => deleteQuestion(q.id, e)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{q.body}</p>
                {q.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {q.tags.map((t) => (
                      <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0">
                        {t}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" /> {q.replyCount} {q.replyCount === 1 ? "reply" : "replies"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDistanceToNow(new Date(q.createdAt), { addSuffix: true })}
                  </span>
                  <button
                    className="hover:text-primary transition-colors"
                    onClick={(e) => { e.stopPropagation(); navigate(`/users/${q.author.username}`); }}
                  >
                    @{q.author.username}
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Question detail with replies ───────────────────────────────────────────
function QuestionDetail({ id }: { id: number }) {
  const afetch = useAuthenticatedFetch();
  const [, navigate] = useLocation();
  const [detail, setDetail] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [markingId, setMarkingId] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function load() {
    try {
      const r = await afetch(`${BASE}/api/mentorship/${id}`);
      if (r.ok) setDetail(await r.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function submitReply() {
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const r = await afetch(`${BASE}/api/mentorship/${id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText.trim() }),
      });
      if (r.ok) { setReplyText(""); load(); }
    } finally {
      setSubmitting(false);
    }
  }

  async function markHelpful(replyId: number) {
    setMarkingId(replyId);
    try {
      const r = await afetch(`${BASE}/api/mentorship/${id}/replies/${replyId}/helpful`, { method: "POST" });
      if (r.ok) load();
    } finally {
      setMarkingId(null);
    }
  }

  if (loading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  }

  if (!detail) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-4">
        <Link href="/mentorship" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Link>
        <Card className="bg-card border-card-border">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">Question not found.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <Link href="/mentorship" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground gap-1">
        <ArrowLeft className="w-4 h-4" /> All questions
      </Link>

      {/* Question */}
      <Card className="bg-card border-card-border">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold leading-snug">{detail.title}</h1>
            {detail.isSolved && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1 shrink-0">
                <CheckCircle className="w-3.5 h-3.5" /> Solved
              </Badge>
            )}
          </div>
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{detail.body}</p>
          {detail.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {detail.tags.map((t) => (
                <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground border-t border-border/50 pt-3">
            <button
              onClick={() => navigate(`/users/${detail.author.username}`)}
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <AvatarBubble author={detail.author} size="sm" />
              @{detail.author.username}
            </button>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(detail.createdAt), { addSuffix: true })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Replies */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {detail.replies.length} {detail.replies.length === 1 ? "Reply" : "Replies"}
        </h2>

        {detail.replies.length === 0 && (
          <Card className="bg-card border-card-border">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No replies yet. Be the first to help!
            </CardContent>
          </Card>
        )}

        {detail.replies.map((reply) => (
          <Card
            key={reply.id}
            className={`bg-card border-card-border transition-all ${reply.isHelpful ? "border-emerald-500/50 bg-emerald-500/5" : ""}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <button onClick={() => navigate(`/users/${reply.author.username}`)}>
                  <AvatarBubble author={reply.author} size="md" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/users/${reply.author.username}`)}
                        className="text-sm font-medium hover:text-primary transition-colors"
                      >
                        @{reply.author.username}
                      </button>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    {reply.isHelpful ? (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1 text-xs">
                        <ThumbsUp className="w-3 h-3" /> Helpful · +5 coins
                      </Badge>
                    ) : (
                      detail.isOwn && !detail.isSolved && !reply.isOwn && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1.5 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                          onClick={() => markHelpful(reply.id)}
                          disabled={markingId === reply.id}
                        >
                          <ThumbsUp className="w-3 h-3" /> Mark Helpful
                        </Button>
                      )
                    )}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reply composer */}
      {!detail.isSolved && (
        <Card className="bg-card border-card-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Post a reply</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              ref={textareaRef}
              placeholder="Share your knowledge or experience… (min 10 characters)"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
              maxLength={2000}
              className="resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  submitReply();
                }
              }}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                If the question author marks your reply as helpful, you earn 5 coins!
              </p>
              <Button
                onClick={submitReply}
                disabled={submitting || replyText.trim().length < 10}
                className="gap-2"
              >
                <Send className="w-3.5 h-3.5" /> Reply
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {detail.isSolved && (
        <Card className="bg-card border-card-border border-emerald-500/30">
          <CardContent className="py-4 text-center text-sm text-emerald-400 flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" /> This question has been marked as solved.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Router ─────────────────────────────────────────────────────────────────
export default function MentorshipPage() {
  const [match, params] = useRoute("/mentorship/:id");
  const id = match && params?.id ? Number(params.id) : null;

  if (id) return <QuestionDetail id={id} />;
  return <QuestionList />;
}
