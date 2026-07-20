import { useState } from "react";
import { useLocation } from "wouter";
import {
  useListProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useListProductReviews,
  useCreateProductReview,
  getListProductsQueryKey,
  getListProductReviewsQueryKey,
} from "@workspace/api-client-react";
import { PhotoUploader, photosToObjectPaths, objectPathsToPhotos, type UploadedPhoto } from "@/components/PhotoUploader";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthenticatedFetch } from "@/lib/api-fetch";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShoppingBag,
  Plus,
  Star,
  Pencil,
  Trash2,
  X,
  MessageCircle,
  ImageIcon,
  HandshakeIcon,
  CheckCircle2,
} from "lucide-react";
import { ReportButton } from "@/components/ReportModal";
import { useGetMyProfile } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const CATEGORIES = [
  "All",
  "Handmade",
  "Fashion",
  "Stationery",
  "Digital",
  "Accessories",
  "Beauty",
  "Food",
  "Gifts",
  "Art",
  "Electronics",
  "Books & Notes",
  "Sports",
];

function StarRating({
  value,
  onChange,
  readonly,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 transition-colors ${
            s <= (hover || value)
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground/40"
          } ${!readonly ? "cursor-pointer" : ""}`}
          onClick={() => !readonly && onChange?.(s)}
          onMouseEnter={() => !readonly && setHover(s)}
          onMouseLeave={() => !readonly && setHover(0)}
        />
      ))}
    </div>
  );
}

type ProductFormData = {
  title: string;
  description: string;
  price: string;
  images: string[];
  category: string;
  contactInfo: string;
};

function ProductForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: Partial<ProductFormData>;
  onSubmit: (d: ProductFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [form, setForm] = useState<Omit<ProductFormData, "images">>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    price: initial?.price ?? "",
    category: initial?.category ?? "Other",
    contactInfo: initial?.contactInfo ?? "",
  });
  const [photos, setPhotos] = useState<UploadedPhoto[]>(
    objectPathsToPhotos(initial?.images ?? [])
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Title *</label>
        <Input
          placeholder="What are you selling?"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          maxLength={120}
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Description *</label>
        <Textarea
          placeholder="Describe your product..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          maxLength={2000}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Price (₹) *</label>
          <Input
            type="number"
            placeholder="0"
            min={0}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Category</label>
          <select
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {CATEGORIES.filter((c) => c !== "All").map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Product Photos <span className="text-muted-foreground font-normal">(up to 5)</span></label>
        <PhotoUploader value={photos} onChange={setPhotos} />
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Contact Info</label>
        <Input
          placeholder="WhatsApp number / email / Instagram handle"
          value={form.contactInfo}
          onChange={(e) => setForm({ ...form, contactInfo: e.target.value })}
          maxLength={200}
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button
          className="flex-1"
          disabled={loading || !form.title || !form.description || !form.price}
          onClick={() => onSubmit({ ...form, images: photosToObjectPaths(photos) })}
        >
          {loading ? "Saving…" : "Save listing"}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function ReviewSection({ productId }: { productId: number }) {
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const { data: reviews = [] } = useListProductReviews(productId);
  const createReview = useCreateProductReview();
  const { data: me } = useGetMyProfile();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showForm, setShowForm] = useState(false);

  const myReview = reviews.find((r) => r.reviewer.username === me?.username);

  async function submit() {
    if (!rating) return;
    await createReview.mutateAsync({ id: productId, data: { rating, comment: comment || undefined } });
    qc.invalidateQueries({ queryKey: getListProductReviewsQueryKey(productId) });
    qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
    setRating(0);
    setComment("");
    setShowForm(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">
          Reviews ({reviews.length})
        </h4>
        {!myReview && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
            <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
            {showForm ? "Cancel" : "Write review"}
          </Button>
        )}
      </div>

      {showForm && (
        <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
          <StarRating value={rating} onChange={setRating} />
          <Textarea
            placeholder="Share your experience (optional)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            maxLength={500}
          />
          <Button size="sm" disabled={!rating || createReview.isPending} onClick={submit}>
            {createReview.isPending ? "Submitting…" : "Submit review"}
          </Button>
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-2">
          {reviews.map((r) => (
            <div key={r.id} className="flex gap-3 py-2 border-t border-border/50 first:border-t-0">
              <Avatar className="w-7 h-7 shrink-0">
                <AvatarFallback
                  style={{ backgroundColor: r.reviewer.avatarColor }}
                  className="text-white text-[10px] font-semibold"
                >
                  {r.reviewer.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <button
                    className="text-xs font-medium hover:text-primary transition-colors"
                    onClick={() => navigate(`/users/${r.reviewer.username}`)}
                  >
                    @{r.reviewer.username}
                  </button>
                  <StarRating value={r.rating} readonly />
                </div>
                {r.comment && (
                  <p className="text-xs text-muted-foreground mt-0.5">{r.comment}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
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

function ProductCard({
  product,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: (p: Product) => void;
  onDelete: (id: number) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const [interested, setInterested] = useState(false);
  const [interestLoading, setInterestLoading] = useState(false);
  const imgUrl = (path: string) =>
    path.startsWith("/objects/") ? `${BASE}/api/storage${path}` : path;
  const mainImage = product.images[0];
  const afetch = useAuthenticatedFetch();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  async function handleInterested() {
    setInterestLoading(true);
    try {
      await afetch(`${BASE}/api/connections/${product.seller.username}/follow`, {
        method: "POST",
      });
      await afetch(`${BASE}/api/messages/conversations/${product.seller.username}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `Hi! I'm interested in your product "${product.title}". Can we connect?`,
        }),
      });
      setInterested(true);
      toast({ title: "Message sent!", description: `You followed @${product.seller.username} and sent them a message.` });
    } catch {
      toast({ title: "Could not send message", variant: "destructive" });
    } finally {
      setInterestLoading(false);
    }
  }

  return (
    <Card className="bg-card border-card-border overflow-hidden">
      <button
        className="w-full text-left"
        onClick={() => navigate(`/marketplace/${product.id}`)}
        aria-label={`View details for ${product.title}`}
      >
        {mainImage && !imgError ? (
          <div className="h-40 bg-muted overflow-hidden">
            <img
              src={imgUrl(mainImage)}
              alt={product.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          <div className="h-40 bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
            <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
          </div>
        )}
      </button>

      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <button
              className="text-left w-full"
              onClick={() => navigate(`/marketplace/${product.id}`)}
            >
              <h3 className="font-semibold text-sm leading-tight truncate hover:text-primary transition-colors">{product.title}</h3>
            </button>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base font-bold text-primary">₹{product.price}</span>
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                {product.category}
              </Badge>
            </div>
          </div>
          {product.isOwner && (
            <div className="flex gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEdit(product)}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onDelete(product.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <StarRating value={Math.round(product.avgRating)} readonly />
          <span className="text-xs text-muted-foreground">
            {product.avgRating > 0 ? product.avgRating.toFixed(1) : "No rating"}{" "}
            ({product.reviewCount})
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            onClick={() => navigate(`/users/${product.seller.username}`)}
          >
            <Avatar className="w-5 h-5">
              <AvatarFallback
                style={{ backgroundColor: product.seller.avatarColor }}
                className="text-white text-[9px] font-semibold"
              >
                {product.seller.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-primary font-medium hover:underline">
              @{product.seller.username}
            </span>
          </button>

          {!product.isOwner && (
            <Button
              size="sm"
              variant={interested ? "secondary" : "default"}
              className="h-7 text-xs px-2.5 gap-1.5 shrink-0"
              disabled={interested || interestLoading}
              onClick={handleInterested}
            >
              {interested ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  Interested
                </>
              ) : (
                <>
                  <HandshakeIcon className="w-3.5 h-3.5" />
                  {interestLoading ? "Sending…" : "Interested"}
                </>
              )}
            </Button>
          )}
        </div>

        {!product.isOwner && (
          <div className="flex justify-end">
            <ReportButton targetType="marketplace" targetId={product.id} label="this listing" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MarketplacePage() {
  const qc = useQueryClient();
  const { data: products = [] } = useListProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [activeTab, setActiveTab] = useState<"all" | "mine">("all");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showCreate, setShowCreate] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const myProducts = (products as Product[]).filter((p) => p.isOwner);

  const filtered =
    activeTab === "mine"
      ? myProducts
      : activeCategory === "All"
      ? products
      : products.filter((p) => p.category === activeCategory);

  async function handleCreate(form: ProductFormData) {
    await createProduct.mutateAsync({
      data: {
        title: form.title,
        description: form.description,
        price: Number(form.price),
        images: form.images,
        category: form.category,
        contactInfo: form.contactInfo || undefined,
      },
    });
    qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
    setShowCreate(false);
  }

  async function handleUpdate(form: ProductFormData) {
    if (!editProduct) return;
    await updateProduct.mutateAsync({
      id: editProduct.id,
      data: {
        title: form.title,
        description: form.description,
        price: Number(form.price),
        images: form.images,
        category: form.category,
        contactInfo: form.contactInfo || undefined,
      },
    });
    qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
    setEditProduct(null);
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this listing?")) return;
    await deleteProduct.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary text-sm font-medium uppercase tracking-widest">
            <ShoppingBag className="w-4 h-4" /> Marketplace
          </div>
          <h1 className="text-3xl font-bold tracking-tight mt-1">Student Marketplace</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Buy and sell products within your student community.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" /> List a product
        </Button>
      </header>

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
          All Products
        </button>
        <button
          onClick={() => setActiveTab("mine")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === "mine"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          My Products
          {myProducts.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold leading-none">
              {myProducts.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "all" && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <Card className="bg-card border-card-border">
          <CardContent className="py-12 text-center">
            <ShoppingBag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {activeTab === "mine"
                ? "You haven't listed any products yet. Click \"List a product\" to get started!"
                : "No products listed yet. Be the first to sell something!"}
            </p>
            {activeTab === "mine" && (
              <Button size="sm" className="mt-4 gap-2" onClick={() => setShowCreate(true)}>
                <Plus className="w-3.5 h-3.5" /> List a product
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(filtered as Product[]).map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onEdit={setEditProduct}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>List a new product</DialogTitle>
          </DialogHeader>
          <ProductForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            loading={createProduct.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editProduct} onOpenChange={(o) => !o && setEditProduct(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit listing</DialogTitle>
          </DialogHeader>
          {editProduct && (
            <ProductForm
              initial={{
                title: editProduct.title,
                description: editProduct.description,
                price: editProduct.price,
                images: editProduct.images,
                category: editProduct.category,
                contactInfo: editProduct.contactInfo ?? "",
              }}
              onSubmit={handleUpdate}
              onCancel={() => setEditProduct(null)}
              loading={updateProduct.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
