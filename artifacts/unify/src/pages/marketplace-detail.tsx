import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useListProductReviews,
  useCreateProductReview,
  getListProductsQueryKey,
  getListProductReviewsQueryKey,
  useGetMyProfile,
} from "@workspace/api-client-react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
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
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Share2,
  Flag,
} from "lucide-react";
import { ReportButton } from "@/components/ReportModal";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function StarRating({ value, onChange, readonly }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-5 h-5 transition-colors ${s <= (hover || value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"} ${!readonly ? "cursor-pointer" : ""}`}
          onClick={() => !readonly && onChange?.(s)}
          onMouseEnter={() => !readonly && setHover(s)}
          onMouseLeave={() => !readonly && setHover(0)}
        />
      ))}
    </div>
  );
}

type Product = {
  id: number;
  title: string;
  description: string;
  price: string;
  images: string[];
  category: string;
  contactInfo?: string | null;
  createdAt: string;
  seller: { id: number; username: string; avatarColor: string };
  avgRating: number;
  reviewCount: number;
  isOwner: boolean;
};

export default function MarketplaceDetailPage() {
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

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["marketplace", "product", id],
    queryFn: async () => {
      const r = await afetch(`${BASE}/api/marketplace/products/${id}`);
      if (!r.ok) throw new Error("not found");
      return r.json();
    },
    enabled: !!id,
  });

  const { data: reviews = [] } = useListProductReviews(Number(id));
  const createReview = useCreateProductReview();

  const imgUrl = (path: string) =>
    path.startsWith("/objects/") ? `${BASE}/api/storage${path}` : path;

  const myReview = reviews.find((r) => r.reviewer.username === me?.username);

  async function handleInterested() {
    if (!product) return;
    setIntLoading(true);
    try {
      await afetch(`${BASE}/api/connections/${product.seller.username}/follow`, { method: "POST" });
      await afetch(`${BASE}/api/messages/conversations/${product.seller.username}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `Hi! I'm interested in your product "${product.title}". Can we connect?` }),
      });
      setInterested(true);
      toast({ title: "Message sent!", description: `You messaged @${product.seller.username}.` });
    } catch {
      toast({ title: "Could not send message", variant: "destructive" });
    } finally {
      setIntLoading(false);
    }
  }

  async function handleDelete() {
    if (!product || !confirm("Delete this listing?")) return;
    await afetch(`${BASE}/api/marketplace/products/${product.id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
    navigate("/marketplace");
  }

  async function submitReview() {
    if (!rating || !product) return;
    await createReview.mutateAsync({ id: product.id, data: { rating, comment: comment || undefined } });
    qc.invalidateQueries({ queryKey: getListProductReviewsQueryKey(product.id) });
    qc.invalidateQueries({ queryKey: ["marketplace", "product", id] });
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

  if (!product) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Product not found.</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate("/marketplace")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Marketplace
        </Button>
      </div>
    );
  }

  const images = product.images;
  const avgStars = Math.round(product.avgRating);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <button
        onClick={() => navigate("/marketplace")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-muted aspect-[4/3]">
            {images.length > 0 ? (
              <img
                src={imgUrl(images[imgIdx])}
                alt={product.title}
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

        {/* Product Info */}
        <div className="space-y-5">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <Badge variant="secondary" className="mb-2 text-xs">{product.category}</Badge>
                <h1 className="text-2xl font-bold leading-tight">{product.title}</h1>
              </div>
              {product.isOwner && (
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/marketplace`)}>
                    <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleDelete}>
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-3">
              <span className="text-3xl font-bold text-primary">₹{product.price}</span>
              <div className="flex items-center gap-1.5">
                <StarRating value={avgStars} readonly />
                <span className="text-sm text-muted-foreground">
                  {product.avgRating > 0 ? product.avgRating.toFixed(1) : "No rating"} ({product.reviewCount} reviews)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-secondary/40 border border-border/50">
            <button onClick={() => navigate(`/users/${product.seller.username}`)} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity flex-1 min-w-0">
              <Avatar className="w-9 h-9">
                <AvatarFallback style={{ backgroundColor: product.seller.avatarColor }} className="text-white text-sm font-semibold">
                  {product.seller.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-primary">@{product.seller.username}</div>
                <div className="text-xs text-muted-foreground">Seller</div>
              </div>
            </button>
            {product.contactInfo && (
              <div className="text-xs text-muted-foreground text-right shrink-0 max-w-[140px]">
                <div className="font-medium text-foreground">Contact</div>
                <div className="truncate">{product.contactInfo}</div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {!product.isOwner && (
              <Button
                className="flex-1 gap-2"
                variant={interested ? "secondary" : "default"}
                disabled={interested || intLoading}
                onClick={handleInterested}
              >
                {interested ? (
                  <><CheckCircle2 className="w-4 h-4 text-green-500" /> Interested — Message Sent</>
                ) : (
                  <><HandshakeIcon className="w-4 h-4" /> {intLoading ? "Sending…" : "I'm Interested"}</>
                )}
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(window.location.href); toast({ title: "Link copied!" }); }}>
              <Share2 className="w-4 h-4" />
            </Button>
            {!product.isOwner && (
              <ReportButton targetType="marketplace" targetId={product.id} label="this listing" />
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Description</h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{product.description}</p>
          </div>

          <div className="text-xs text-muted-foreground">
            Listed {new Date(product.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <Card className="bg-card border-card-border">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Reviews</h2>
              <div className="flex items-center gap-2 mt-1">
                <StarRating value={avgStars} readonly />
                <span className="text-sm font-semibold">{product.avgRating > 0 ? product.avgRating.toFixed(1) : "—"}</span>
                <span className="text-sm text-muted-foreground">· {reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
            {!myReview && !product.isOwner && (
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
                placeholder="Share your experience with this product (optional)..."
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
                      <StarRating value={r.rating} readonly />
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
