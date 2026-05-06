import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useListServiceReviews,
  useCreateServiceReview,
  getListServicesQueryKey,
  getListServiceReviewsQueryKey,
  useGetMyProfile,
} from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthenticatedFetch } from "@/lib/api-fetch";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Star,
  MessageCircle,
  Pencil,
  Trash2,
  ImageIcon,
  HandshakeIcon,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Share2,
} from "lucide-react";
import { ReportButton } from "@/components/ReportModal";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const categoryAccents: Record<string, string> = {
  Photography: "#f59e0b",
  Videography: "#ef4444",
  "Video Editing": "#8b5cf6",
  "Web Development": "#3b82f6",
  "Event Decoration": "#ec4899",
  "Script Writing": "#10b981",
  "Graphic Design": "#f97316",
  "Music & Audio": "#6366f1",
  Other: "#7c5cff",
};

function StarRating({ value, onChange, readonly, size = "md" }: { value: number; onChange?: (v: number) => void; readonly?: boolean; size?: "sm" | "md" | "lg" }) {
  const [hover, setHover] = useState(0);
  const sz = size === "lg" ? "w-6 h-6" : size === "sm" ? "w-4 h-4" : "w-5 h-5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${sz} transition-colors ${s <= (hover || value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"} ${!readonly ? "cursor-pointer" : ""}`}
          onClick={() => !readonly && onChange?.(s)}
          onMouseEnter={() => !readonly && setHover(s)}
          onMouseLeave={() => !readonly && setHover(0)}
        />
      ))}
    </div>
  );
}

type Service = {
  id: number;
  title: string;
  description: string;
  price: string;
  category: string;
  images: string[];
  contactInfo?: string | null;
  deliveryDays: number;
  createdAt: string;
  provider: { id: number; username: string; avatarColor: string };
  avgRating: number;
  reviewCount: number;
  isOwner: boolean;
};

export default function FreelanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const afetch = useAuthenticatedFetch();
  const qc = useQueryClient();
  const { data: me } = useGetMyProfile();
  const { toast } = useToast();

  const [imgIdx, setImgIdx] = useState(0);
  const [interested, setInterested] = useState(false);
  const [intLoading, setIntLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { data: service, isLoading } = useQuery<Service>({
    queryKey: ["freelance", "service", id],
    queryFn: async () => {
      const r = await afetch(`${BASE}/api/freelance/services/${id}`);
      if (!r.ok) throw new Error("not found");
      return r.json();
    },
    enabled: !!id,
  });

  const { data: reviews = [] } = useListServiceReviews(Number(id));
  const createReview = useCreateServiceReview();

  const imgUrl = (path: string) =>
    path.startsWith("/objects/") ? `${BASE}/api/storage${path}` : path;

  const myReview = reviews.find((r) => r.reviewer.username === me?.username);
  const accent = service ? (categoryAccents[service.category] ?? "#7c5cff") : "#7c5cff";

  async function handleInterested() {
    if (!service) return;
    setIntLoading(true);
    try {
      await afetch(`${BASE}/api/connections/${service.provider.username}/follow`, { method: "POST" });
      await afetch(`${BASE}/api/messages/conversations/${service.provider.username}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `Hi! I'm interested in your service "${service.title}" (₹${service.price}). Can we discuss further?` }),
      });
      setInterested(true);
      toast({ title: "Message sent!", description: `You messaged @${service.provider.username}.` });
    } catch {
      toast({ title: "Could not send message", variant: "destructive" });
    } finally {
      setIntLoading(false);
    }
  }

  async function handleDelete() {
    if (!service || !confirm("Delete this service listing?")) return;
    await afetch(`${BASE}/api/freelance/services/${service.id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: getListServicesQueryKey({}) });
    navigate("/freelance");
  }

  async function submitReview() {
    if (!rating || !service) return;
    await createReview.mutateAsync({ id: service.id, data: { rating, comment: comment || undefined } });
    qc.invalidateQueries({ queryKey: getListServiceReviewsQueryKey(service.id) });
    qc.invalidateQueries({ queryKey: ["freelance", "service", id] });
    setRating(0);
    setComment("");
    setShowReviewForm(false);
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Service not found.</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate("/freelance")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Freelance
        </Button>
      </div>
    );
  }

  const images = service.images;
  const avgStars = Math.round(service.avgRating);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <button
        onClick={() => navigate("/freelance")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Freelance
      </button>

      {/* Accent bar */}
      <div className="h-1 rounded-full" style={{ backgroundColor: accent }} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-muted aspect-[4/3]">
            {images.length > 0 ? (
              <img
                src={imgUrl(images[imgIdx])}
                alt={service.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
              </div>
            )}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIdx ? "bg-white" : "bg-white/40"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${i === imgIdx ? "border-primary" : "border-border/40 hover:border-border"}`}
                >
                  <img src={imgUrl(img)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Service Info */}
        <div className="space-y-5">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <Badge
                  className="mb-2 text-xs"
                  style={{ backgroundColor: accent + "22", color: accent, borderColor: accent + "44" }}
                  variant="outline"
                >
                  {service.category}
                </Badge>
                <h1 className="text-2xl font-bold leading-tight">{service.title}</h1>
              </div>
              {service.isOwner && (
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => navigate("/freelance")}>
                    <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleDelete}>
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <span className="text-3xl font-bold text-primary">Starting ₹{service.price}</span>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {service.deliveryDays} day{service.deliveryDays !== 1 ? "s" : ""} delivery
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <StarRating value={avgStars} readonly />
              <span className="text-sm font-semibold">{service.avgRating > 0 ? service.avgRating.toFixed(1) : "—"}</span>
              <span className="text-sm text-muted-foreground">· {reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-secondary/40 border border-border/50">
            <button onClick={() => navigate(`/users/${service.provider.username}`)} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity flex-1 min-w-0">
              <Avatar className="w-9 h-9">
                <AvatarFallback style={{ backgroundColor: service.provider.avatarColor }} className="text-white text-sm font-semibold">
                  {service.provider.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-primary">@{service.provider.username}</div>
                <div className="text-xs text-muted-foreground">Service Provider</div>
              </div>
            </button>
            {service.contactInfo && (
              <div className="text-xs text-muted-foreground text-right shrink-0 max-w-[140px]">
                <div className="font-medium text-foreground">Contact</div>
                <div className="truncate">{service.contactInfo}</div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {!service.isOwner && (
              <Button
                className="flex-1 gap-2"
                variant={interested ? "secondary" : "default"}
                disabled={interested || intLoading}
                onClick={handleInterested}
              >
                {interested ? (
                  <><CheckCircle2 className="w-4 h-4 text-green-500" /> Messaged!</>
                ) : (
                  <><HandshakeIcon className="w-4 h-4" /> {intLoading ? "Sending…" : "I'm Interested"}</>
                )}
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(window.location.href); toast({ title: "Link copied!" }); }}>
              <Share2 className="w-4 h-4" />
            </Button>
            {!service.isOwner && (
              <ReportButton targetType="freelance" targetId={service.id} label="this service" />
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">About this Service</h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{service.description}</p>
          </div>

          <div className="text-xs text-muted-foreground">
            Listed {new Date(service.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <Card className="bg-card border-card-border">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Client Reviews</h2>
              <div className="flex items-center gap-2 mt-1">
                <StarRating value={avgStars} readonly />
                <span className="text-sm font-semibold">{service.avgRating > 0 ? service.avgRating.toFixed(1) : "—"}</span>
                <span className="text-sm text-muted-foreground">· {reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
            {!myReview && !service.isOwner && (
              <Button variant="outline" size="sm" onClick={() => setShowReviewForm(!showReviewForm)}>
                <MessageCircle className="w-4 h-4 mr-1.5" />
                {showReviewForm ? "Cancel" : "Write a Review"}
              </Button>
            )}
          </div>

          {showReviewForm && (
            <div className="border border-border rounded-xl p-4 space-y-3 bg-secondary/20">
              <div>
                <div className="text-sm font-medium mb-2">Your Rating</div>
                <StarRating value={rating} onChange={setRating} />
              </div>
              <Textarea
                placeholder="Share your experience with this service (optional)..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <div className="flex gap-2">
                <Button disabled={!rating || createReview.isPending} onClick={submitReview}>
                  {createReview.isPending ? "Submitting…" : "Submit Review"}
                </Button>
                <Button variant="ghost" onClick={() => setShowReviewForm(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No reviews yet. Be the first to leave one!</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="flex gap-4 py-4 border-t border-border/40 first:border-t-0">
                  <Avatar className="w-9 h-9 shrink-0">
                    <AvatarFallback style={{ backgroundColor: r.reviewer.avatarColor }} className="text-white text-sm font-semibold">
                      {r.reviewer.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button className="text-sm font-semibold hover:text-primary transition-colors" onClick={() => navigate(`/users/${r.reviewer.username}`)}>
                        @{r.reviewer.username}
                      </button>
                      <StarRating value={r.rating} readonly size="sm" />
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    {r.comment && <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{r.comment}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
