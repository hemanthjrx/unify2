import { useState } from "react";
import {
  useListServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
  useListServiceReviews,
  useCreateServiceReview,
  getListServicesQueryKey,
  getListServiceReviewsQueryKey,
} from "@workspace/api-client-react";
import { PhotoUploader, photosToObjectPaths, objectPathsToPhotos, type UploadedPhoto } from "@/components/PhotoUploader";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
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
  Briefcase,
  Plus,
  Star,
  Pencil,
  Trash2,
  Clock,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Camera,
  Video,
  Globe,
  Palette,
  Music,
  Film,
  FileText,
  Sparkles,
  HandshakeIcon,
} from "lucide-react";
import { useGetMyProfile } from "@workspace/api-client-react";
import { useAuthenticatedFetch } from "@/lib/api-fetch";
import { useLocation, Link } from "wouter";
import { ReportButton } from "@/components/ReportModal";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const SERVICE_CATEGORIES = [
  { name: "All", icon: Sparkles },
  { name: "Photography", icon: Camera },
  { name: "Videography", icon: Video },
  { name: "Video Editing", icon: Film },
  { name: "Web Development", icon: Globe },
  { name: "Event Decoration", icon: Palette },
  { name: "Script Writing", icon: FileText },
  { name: "Graphic Design", icon: Palette },
  { name: "Music & Audio", icon: Music },
  { name: "Other", icon: Sparkles },
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

type ServiceFormData = {
  title: string;
  description: string;
  price: string;
  category: string;
  images: string[];
  contactInfo: string;
  deliveryDays: string;
};

function ServiceForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: Partial<ServiceFormData>;
  onSubmit: (d: ServiceFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [form, setForm] = useState<Omit<ServiceFormData, "images">>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    price: initial?.price ?? "",
    category: initial?.category ?? "Other",
    contactInfo: initial?.contactInfo ?? "",
    deliveryDays: initial?.deliveryDays ?? "7",
  });
  const [photos, setPhotos] = useState<UploadedPhoto[]>(
    objectPathsToPhotos(initial?.images ?? [])
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Service Title *</label>
        <Input
          placeholder="e.g. Professional Event Photography"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          maxLength={120}
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Description *</label>
        <Textarea
          placeholder="Describe your service, what's included, your experience..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          maxLength={2000}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Starting Price (₹) *</label>
          <Input
            type="number"
            placeholder="0"
            min={0}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Delivery (days)</label>
          <Input
            type="number"
            placeholder="7"
            min={1}
            max={365}
            value={form.deliveryDays}
            onChange={(e) => setForm({ ...form, deliveryDays: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Category *</label>
        <select
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          {SERVICE_CATEGORIES.filter((c) => c.name !== "All").map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Portfolio Photos <span className="text-muted-foreground font-normal">(up to 5)</span></label>
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
          disabled={loading || !form.title || !form.description || !form.price || !form.category}
          onClick={() => onSubmit({ ...form, images: photosToObjectPaths(photos) })}
        >
          {loading ? "Saving…" : "Save service"}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function ReviewSection({ serviceId }: { serviceId: number }) {
  const qc = useQueryClient();
  const { data: reviews = [] } = useListServiceReviews(serviceId);
  const createReview = useCreateServiceReview();
  const { data: me } = useGetMyProfile();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showForm, setShowForm] = useState(false);

  const myReview = reviews.find((r) => r.reviewer.username === me?.username);

  async function submit() {
    if (!rating) return;
    await createReview.mutateAsync({ id: serviceId, data: { rating, comment: comment || undefined } });
    qc.invalidateQueries({ queryKey: getListServiceReviewsQueryKey(serviceId) });
    qc.invalidateQueries({ queryKey: getListServicesQueryKey({}) });
    setRating(0);
    setComment("");
    setShowForm(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">Reviews ({reviews.length})</h4>
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
                  <span className="text-xs font-medium">@{r.reviewer.username}</span>
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

function ServiceCard({
  service,
  onEdit,
  onDelete,
}: {
  service: Service;
  onEdit: (s: Service) => void;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [interested, setInterested] = useState(false);
  const [intLoading, setIntLoading] = useState(false);
  const afetch = useAuthenticatedFetch();
  const [, navigate] = useLocation();
  const imgUrl = (path: string) =>
    path.startsWith("/objects/") ? `${BASE}/api/storage${path}` : path;
  const mainImage = service.images[0];
  const accent = categoryAccents[service.category] ?? "#7c5cff";

  async function handleInterested() {
    setIntLoading(true);
    try {
      await afetch(`${BASE}/api/connections/${service.provider.username}/follow`, { method: "POST" });
      await afetch(`${BASE}/api/messages/conversations/${service.provider.username}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: `Hi! I'm interested in your service "${service.title}" (₹${service.price}). Can we discuss further?`,
        }),
      });
      setInterested(true);
      navigate(`/messages/${service.provider.username}`);
    } catch {
      // silent
    } finally {
      setIntLoading(false);
    }
  }

  return (
    <Card className="bg-card border-card-border overflow-hidden">
      <div className="h-1.5" style={{ backgroundColor: accent }} />
      <button
        className="w-full text-left"
        onClick={() => navigate(`/freelance/${service.id}`)}
        aria-label={`View details for ${service.title}`}
      >
        {mainImage && !imgError ? (
          <div className="h-36 bg-muted overflow-hidden">
            <img
              src={imgUrl(mainImage)}
              alt={service.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          <div className="h-36 bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
            <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
          </div>
        )}
      </button>

      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Badge
              className="text-[10px] px-1.5 h-4 mb-1.5"
              style={{ backgroundColor: accent + "22", color: accent, borderColor: accent + "44" }}
              variant="outline"
            >
              {service.category}
            </Badge>
            <button
              className="text-left w-full"
              onClick={() => navigate(`/freelance/${service.id}`)}
            >
              <h3 className="font-semibold text-sm leading-tight hover:text-primary transition-colors">{service.title}</h3>
            </button>
          </div>
          {service.isOwner && (
            <div className="flex gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEdit(service)}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onDelete(service.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-primary">Starting ₹{service.price}</span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {service.deliveryDays}d delivery
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <StarRating value={Math.round(service.avgRating)} readonly />
          <span className="text-xs text-muted-foreground">
            {service.avgRating > 0 ? service.avgRating.toFixed(1) : "No rating"}{" "}
            ({service.reviewCount})
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Link
            href={`/users/${service.provider.username}`}
            className="flex items-center gap-2 hover:text-primary transition-colors"
          >
            <Avatar className="w-5 h-5">
              <AvatarFallback
                style={{ backgroundColor: service.provider.avatarColor }}
                className="text-white text-[9px] font-semibold"
              >
                {service.provider.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">@{service.provider.username}</span>
          </Link>

          {!service.isOwner && (
            <Button
              size="sm"
              variant={interested ? "secondary" : "default"}
              className={`h-7 text-xs gap-1.5 shrink-0 ${
                interested
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-primary/90 hover:bg-primary text-primary-foreground"
              }`}
              onClick={handleInterested}
              disabled={intLoading || interested}
            >
              <HandshakeIcon className="w-3.5 h-3.5" />
              {intLoading ? "Sending…" : interested ? "Messaged!" : "Interested"}
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            className="flex items-center gap-1 text-xs text-primary font-medium"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" /> Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" /> View details & reviews
              </>
            )}
          </button>
          {!service.isOwner && (
            <ReportButton targetType="freelance" targetId={service.id} label="this service" />
          )}
        </div>

        {expanded && (
          <div className="space-y-4 pt-1 border-t border-border/50">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{service.description}</p>

            {service.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {service.images.slice(1).map((img, i) => (
                  <img
                    key={i}
                    src={imgUrl(img)}
                    alt=""
                    className="h-20 w-28 object-cover rounded shrink-0"
                    onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                  />
                ))}
              </div>
            )}

            {service.contactInfo && (
              <div className="text-xs bg-muted/50 rounded-md p-2.5">
                <span className="font-medium">Contact: </span>
                {service.contactInfo}
              </div>
            )}

            <ReviewSection serviceId={service.id} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function FreelancePage() {
  const qc = useQueryClient();
  const { data: services = [] } = useListServices({});
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const [activeTab, setActiveTab] = useState<"all" | "mine">("all");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showCreate, setShowCreate] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);

  const myServices = (services as Service[]).filter((s) => s.isOwner);

  const filtered =
    activeTab === "mine"
      ? myServices
      : activeCategory === "All"
      ? services
      : services.filter((s) => s.category === activeCategory);

  async function handleCreate(form: ServiceFormData) {
    await createService.mutateAsync({
      data: {
        title: form.title,
        description: form.description,
        price: Number(form.price),
        category: form.category,
        images: form.images,
        contactInfo: form.contactInfo || undefined,
        deliveryDays: Number(form.deliveryDays) || 7,
      },
    });
    qc.invalidateQueries({ queryKey: getListServicesQueryKey({}) });
    setShowCreate(false);
  }

  async function handleUpdate(form: ServiceFormData) {
    if (!editService) return;
    await updateService.mutateAsync({
      id: editService.id,
      data: {
        title: form.title,
        description: form.description,
        price: Number(form.price),
        category: form.category,
        images: form.images,
        contactInfo: form.contactInfo || undefined,
        deliveryDays: Number(form.deliveryDays) || 7,
      },
    });
    qc.invalidateQueries({ queryKey: getListServicesQueryKey({}) });
    setEditService(null);
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this service listing?")) return;
    await deleteService.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: getListServicesQueryKey({}) });
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary text-sm font-medium uppercase tracking-widest">
            <Briefcase className="w-4 h-4" /> Freelance
          </div>
          <h1 className="text-3xl font-bold tracking-tight mt-1">Student Services</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hire talented students or offer your own services to the community.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" /> Offer a service
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
          All Services
        </button>
        <button
          onClick={() => setActiveTab("mine")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === "mine"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          My Services
          {myServices.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold leading-none">
              {myServices.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "all" && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {SERVICE_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                  activeCategory === cat.name
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                }`}
              >
                <Icon className="w-3 h-3" />
                {cat.name}
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <Card className="bg-card border-card-border">
          <CardContent className="py-12 text-center">
            <Briefcase className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {activeTab === "mine"
                ? "You haven't listed any services yet. Click \"Offer a service\" to get started!"
                : "No services listed yet. Be the first to offer yours!"}
            </p>
            {activeTab === "mine" && (
              <Button size="sm" className="mt-4 gap-2" onClick={() => setShowCreate(true)}>
                <Plus className="w-3.5 h-3.5" /> Offer a service
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(filtered as Service[]).map((s) => (
            <ServiceCard
              key={s.id}
              service={s}
              onEdit={setEditService}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Offer a new service</DialogTitle>
          </DialogHeader>
          <ServiceForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            loading={createService.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editService} onOpenChange={(o) => !o && setEditService(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit service</DialogTitle>
          </DialogHeader>
          {editService && (
            <ServiceForm
              initial={{
                title: editService.title,
                description: editService.description,
                price: editService.price,
                category: editService.category,
                images: editService.images,
                contactInfo: editService.contactInfo ?? "",
                deliveryDays: String(editService.deliveryDays),
              }}
              onSubmit={handleUpdate}
              onCancel={() => setEditService(null)}
              loading={updateService.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
