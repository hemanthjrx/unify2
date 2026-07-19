import { useState, useRef, useEffect } from "react";
import { useGetMyProfile } from "@workspace/api-client-react";
import { useAuthenticatedFetch } from "@/lib/api-fetch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Shield,
  Users,
  ShoppingBag,
  Briefcase,
  PlusCircle,
  Trash2,
  Ban,
  CheckCircle,
  ChevronLeft,
  X,
  Pencil,
  Mail,
  Phone,
  Hash,
  Calendar,
  Activity,
  Crown,
  Clock,
  UserMinus,
  FileText,
  Flag,
  Search,
  ExternalLink,
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  ImageIcon,
  Upload,
  Eye,
  EyeOff,
  Tag,
  ZoomIn,
  ZoomOut,
  Layers,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type AdminUser = {
  id: number;
  username: string | null;
  email: string | null;
  mobileNumber: string | null;
  usn: string | null;
  role: string;
  isBanned: boolean;
  avatarColor: string;
  coins: number;
  onboardingComplete: boolean;
  createdAt: string;
};

type AdminUserDetail = AdminUser & {
  bio: string | null;
  skills: string[];
  weeklyPoints: number;
  communityCount: number;
  bannerColor: string;
  activities: {
    id: number;
    kind: string;
    message: string;
    targetName: string | null;
    createdAt: string;
  }[];
};

type Community = {
  id: number;
  slug: string;
  name: string;
  description: string;
  accentColor: string;
  icon: string;
  tags: string[];
  memberCount?: number;
  isMember?: boolean;
  createdAt?: string;
  bannerImageUrl?: string | null;
  profileImageUrl?: string | null;
  leaderId?: number | null;
  leaderUsername?: string | null;
};

type Moderator = {
  id: number;
  username: string | null;
  name: string | null;
  email: string | null;
  createdAt: string;
  isBanned: boolean;
};

type CommunityMember = {
  id: number;
  username: string;
  avatarColor: string | null;
  joinedAt: string;
};

type MarketplaceItem = {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  contactInfo: string | null;
  createdAt: string;
  sellerId: number;
  sellerUsername: string | null;
};

type FreelanceItem = {
  id: number;
  title: string;
  category: string;
  price: number;
  createdAt: string;
  providerId: number;
  providerUsername: string | null;
};

type Tab = "users" | "communities" | "marketplace" | "freelance" | "applications" | "reports" | "moderators" | "categories";

type Application = {
  id: number;
  name: string | null;
  username: string | null;
  usn: string | null;
  email: string | null;
  mobileNumber: string | null;
  branch: string | null;
  semester: string | null;
  avatarColor: string;
  accountStatus: string;
  idCardUrl: string | null;
  feeReceiptUrl: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  reviewerUsername: string | null;
  reviewerRole: string | null;
};

type Report = {
  id: number;
  targetType: string;
  targetId: number | null;
  targetUsn: string | null;
  description: string;
  status: string;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  reporterUsername: string | null;
  reportedUserId: number | null;
  reportedUsername: string | null;
};

const BAN_OPTIONS = [
  { value: "3d",        label: "3 Days" },
  { value: "1w",        label: "1 Week" },
  { value: "1m",        label: "1 Month" },
  { value: "3m",        label: "3 Months" },
  { value: "manual",    label: "Until Manually Unbanned" },
  { value: "permanent", label: "Permanently" },
];

type WarningStrike = {
  id: number;
  description: string;
  screenshotUrl: string | null;
  createdAt: string;
  issuedByUsername: string | null;
};

function WarningBanModal({
  userId,
  username,
  onWarnSuccess,
  onBanConfirm,
  onCancel,
}: {
  userId: number;
  username: string;
  onWarnSuccess: (result: { totalWarnings: number; autoBanned: boolean }) => void;
  onBanConfirm: (duration: string) => void;
  onCancel: () => void;
}) {
  const api = useAdminFetch();
  const [banDuration, setBanDuration] = useState("manual");
  const [warnDesc, setWarnDesc] = useState("");
  const [warnUrl, setWarnUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [warnings, setWarnings] = useState<WarningStrike[]>([]);
  const [warnLoading, setWarnLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin/users/${userId}/warnings`).then((d) => { setWarnings(d); setWarnLoading(false); }).catch(() => setWarnLoading(false));
  }, [userId]);

  async function submitWarning() {
    if (!warnDesc.trim() || submitting) return;
    setSubmitting(true);
    try {
      const result = await api.post(`/admin/users/${userId}/warnings`, {
        description: warnDesc.trim(),
        screenshotUrl: warnUrl.trim() || null,
      });
      onWarnSuccess(result);
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-card-border rounded-xl shadow-2xl w-full max-w-md p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-bold text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" /> Actions for @{username}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Issue a warning or ban this student</div>
          </div>
          <button onClick={onCancel}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>

        {/* Section 1: Give Warning */}
        <div className="space-y-3 border border-yellow-500/20 rounded-xl p-4 bg-yellow-500/5">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-sm flex items-center gap-2 text-yellow-400">
              <AlertTriangle className="w-3.5 h-3.5" /> Give Warning Strike
            </div>
            <div className="text-xs text-muted-foreground">
              {warnLoading ? "…" : `${warnings.length}/5 strikes`}
            </div>
          </div>
          {!warnLoading && warnings.length > 0 && (
            <div className="space-y-1.5 max-h-28 overflow-y-auto">
              {warnings.map((w, i) => (
                <div key={w.id} className="text-xs bg-secondary/60 border border-border rounded-lg px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-medium text-yellow-400">Strike {warnings.length - i}</span>
                    <span className="text-muted-foreground">{new Date(w.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-foreground/80 leading-snug">{w.description}</p>
                  {w.screenshotUrl && (
                    <a href={w.screenshotUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 mt-0.5">
                      <ExternalLink className="w-2.5 h-2.5" /> View evidence
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
          <Textarea
            placeholder="Describe the reason for this warning…"
            value={warnDesc}
            onChange={(e) => setWarnDesc(e.target.value)}
            rows={2}
            className="resize-none text-sm"
          />
          <Input
            placeholder="Screenshot / evidence URL (optional)"
            value={warnUrl}
            onChange={(e) => setWarnUrl(e.target.value)}
            className="text-sm"
          />
          <Button
            size="sm"
            className="w-full gap-2 bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 border border-yellow-500/30"
            variant="outline"
            disabled={!warnDesc.trim() || submitting}
            onClick={submitWarning}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {submitting ? "Issuing…" : `Issue Warning Strike (${warnings.length + 1}/5)`}
          </Button>
        </div>

        {/* Section 2: Ban */}
        <div className="space-y-3 border border-destructive/20 rounded-xl p-4 bg-destructive/5">
          <div className="font-semibold text-sm flex items-center gap-2 text-destructive">
            <Ban className="w-3.5 h-3.5" /> Ban Student
          </div>
          <div className="grid grid-cols-2 gap-2">
            {BAN_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setBanDuration(opt.value)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  banDuration === opt.value
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : "border-border text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                {opt.label}
              </button>
            ))}
          </div>
          <Button variant="destructive" size="sm" className="w-full" onClick={() => onBanConfirm(banDuration)}>
            <Ban className="w-3.5 h-3.5 mr-1.5" /> Ban Student
          </Button>
        </div>

        <Button variant="ghost" size="sm" className="w-full" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function useAdminFetch() {
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
    patch: async (path: string, body: unknown) => {
      const res = await authFetch(`${BASE}/api${path}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
    del: async (path: string) => {
      const res = await authFetch(`${BASE}/api${path}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error(`${res.status}`);
    },
  };
}

export default function AdminPage() {
  const { data: profile } = useGetMyProfile();
  const isAdmin = profile?.role === "admin";
  const isModerator = profile?.role === "moderator";
  const hasAccess = isAdmin || isModerator;

  const [tab, setTab] = useState<Tab>(isModerator ? "applications" : "users");
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);

  if (!profile) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-12">
        <Shield className="w-12 h-12 text-muted-foreground" />
        <div>
          <div className="text-lg font-semibold">Access Denied</div>
          <div className="text-sm text-muted-foreground">You need admin or moderator privileges to view this page.</div>
        </div>
      </div>
    );
  }

  if (selectedUser) {
    return <UserDetailView user={selectedUser} onBack={() => setSelectedUser(null)} />;
  }

  const allTabs = [
    { id: "applications" as const, label: "Applications", icon: UserCheck },
    { id: "reports" as const, label: "Reports", icon: Flag },
    { id: "users" as const, label: "Students", icon: Users, adminOnly: true },
    { id: "communities" as const, label: "Communities", icon: Crown, adminOnly: true },
    { id: "marketplace" as const, label: "Marketplace", icon: ShoppingBag, adminOnly: true },
    { id: "freelance" as const, label: "Freelance", icon: Briefcase, adminOnly: true },
    { id: "categories" as const, label: "Categories", icon: Tag, adminOnly: true },
    { id: "moderators" as const, label: "Moderators", icon: ShieldCheck, adminOnly: true },
  ];

  const visibleTabs = allTabs.filter((t) => !t.adminOnly || isAdmin);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{isAdmin ? "Admin" : "Moderator"} Panel</h1>
          <p className="text-sm text-muted-foreground">Manage students, communities, and listings</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border pb-0 flex-wrap">
        {visibleTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "applications" && <ApplicationsTab isAdmin={isAdmin} />}
      {tab === "reports" && <ReportsTab isAdmin={isAdmin} />}
      {tab === "users" && isAdmin && <UsersTab onSelectUser={setSelectedUser} />}
      {tab === "communities" && isAdmin && <CommunitiesTab />}
      {tab === "marketplace" && isAdmin && <MarketplaceTab />}
      {tab === "freelance" && isAdmin && <FreelanceTab />}
      {tab === "categories" && isAdmin && <CategoriesTab />}
      {tab === "moderators" && isAdmin && <ModeratorsTab />}
    </div>
  );
}

function UsersTab({ onSelectUser }: { onSelectUser: (u: AdminUserDetail) => void }) {
  const api = useAdminFetch();
  const qc = useQueryClient();
  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["admin", "users"],
    queryFn: () => api.get("/admin/users"),
  });

  const [actionTarget, setActionTarget] = useState<AdminUser | null>(null);

  const banMutation = useMutation({
    mutationFn: ({ id, isBanned, banDuration }: { id: number; isBanned: boolean; banDuration?: string }) =>
      api.patch(`/admin/users/${id}`, { isBanned, ...(banDuration ? { banDuration } : {}) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      setActionTarget(null);
    },
  });

  const [search, setSearch] = useState("");
  const filtered = users.filter(
    (u) =>
      !search ||
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.usn?.toLowerCase().includes(search.toLowerCase()),
  );

  async function openUser(id: number) {
    const detail: AdminUserDetail = await api.get(`/admin/users/${id}`);
    onSelectUser(detail);
  }

  if (isLoading) return <div className="text-muted-foreground text-sm">Loading students…</div>;

  return (
    <div className="space-y-4">
      {actionTarget && (
        <WarningBanModal
          userId={actionTarget.id}
          username={actionTarget.username ?? "unknown"}
          onWarnSuccess={({ autoBanned }) => {
            qc.invalidateQueries({ queryKey: ["admin", "users"] });
            if (autoBanned) setActionTarget(null);
            else setActionTarget(null);
          }}
          onBanConfirm={(duration) => banMutation.mutate({ id: actionTarget.id, isBanned: true, banDuration: duration })}
          onCancel={() => setActionTarget(null)}
        />
      )}
      <Input
        placeholder="Search by username, email or USN…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      <div className="text-xs text-muted-foreground">{filtered.length} students</div>
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Student</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">USN</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Mobile</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <tr
                key={u.id}
                className={`border-t border-border hover:bg-secondary/30 transition-colors ${
                  u.isBanned ? "opacity-60" : ""
                } ${i % 2 === 0 ? "" : "bg-secondary/10"}`}
              >
                <td className="px-4 py-3">
                  <button
                    onClick={() => openUser(u.id)}
                    className="flex items-center gap-2 hover:underline text-left"
                  >
                    <Avatar className="w-7 h-7">
                      <AvatarFallback
                        style={{ backgroundColor: u.avatarColor }}
                        className="text-white text-xs font-bold"
                      >
                        {(u.username?.[0] || "?").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">@{u.username || "—"}</span>
                    {u.isBanned && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 font-semibold">
                        BANNED
                      </span>
                    )}
                  </button>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u.email || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{u.usn || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.mobileNumber || "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      u.role === "admin"
                        ? "bg-violet-500/20 text-violet-400"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      u.onboardingComplete
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {u.onboardingComplete ? "Active" : "Onboarding"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => openUser(u.id)}
                    >
                      View
                    </Button>
                    {u.isBanned ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        disabled={banMutation.isPending}
                        onClick={() => banMutation.mutate({ id: u.id, isBanned: false })}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" /> Unban
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 px-2 text-xs"
                        onClick={() => setActionTarget(u)}
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" /> Warn/Ban
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">No students found.</div>
        )}
      </div>
    </div>
  );
}

function UserDetailView({ user, onBack }: { user: AdminUserDetail; onBack: () => void }) {
  const api = useAdminFetch();
  const qc = useQueryClient();
  const [showActionModal, setShowActionModal] = useState(false);

  const { data: freshWarnings, refetch: refetchWarnings } = useQuery<WarningStrike[]>({
    queryKey: ["admin", "user-warnings", user.id],
    queryFn: () => api.get(`/admin/users/${user.id}/warnings`),
  });

  const banMutation = useMutation({
    mutationFn: ({ isBanned, banDuration }: { isBanned: boolean; banDuration?: string }) =>
      api.patch(`/admin/users/${user.id}`, { isBanned, ...(banDuration ? { banDuration } : {}) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      setShowActionModal(false);
      onBack();
    },
  });

  const kindColors: Record<string, string> = {
    post_created: "bg-violet-500/20 text-violet-400",
    community_join: "bg-emerald-500/20 text-emerald-400",
    community_leave: "bg-orange-500/20 text-orange-400",
    follow: "bg-sky-500/20 text-sky-400",
    comment: "bg-pink-500/20 text-pink-400",
    like: "bg-red-500/20 text-red-400",
    marketplace_listed: "bg-yellow-500/20 text-yellow-400",
    freelance_listed: "bg-teal-500/20 text-teal-400",
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {showActionModal && (
        <WarningBanModal
          userId={user.id}
          username={user.username ?? "unknown"}
          onWarnSuccess={() => {
            refetchWarnings();
            setShowActionModal(false);
          }}
          onBanConfirm={(duration) => banMutation.mutate({ isBanned: true, banDuration: duration })}
          onCancel={() => setShowActionModal(false)}
        />
      )}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to students
      </button>

      {/* Profile card */}
      <Card className="bg-card border-card-border overflow-hidden">
        <div
          className="h-20"
          style={{
            background: `linear-gradient(135deg, ${user.bannerColor || "#1a1040"}, #0c0c14)`,
          }}
        />
        <CardContent className="-mt-10 pb-5">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="flex items-end gap-3">
              <Avatar className="w-20 h-20 ring-4 ring-card">
                <AvatarFallback
                  style={{ backgroundColor: user.avatarColor }}
                  className="text-white text-2xl font-bold"
                >
                  {(user.username?.[0] || "?").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <div className="text-xl font-bold">@{user.username || "—"}</div>
                  {user.isBanned && (
                    <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400 font-semibold">
                      BANNED
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      user.role === "admin"
                        ? "bg-violet-500/20 text-violet-400"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">{user.bio || "No bio"}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user.isBanned ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => banMutation.mutate({ isBanned: false })}
                  disabled={banMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" /> Unban student
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10"
                    onClick={() => setShowActionModal(true)}
                    disabled={banMutation.isPending}
                  >
                    <AlertTriangle className="w-4 h-4 mr-1.5" /> Warn / Ban
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border-card-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow icon={<Mail className="w-4 h-4 text-sky-400" />} label="Email" value={user.email || "Not provided"} />
            <InfoRow icon={<Phone className="w-4 h-4 text-emerald-400" />} label="Mobile" value={user.mobileNumber || "Not provided"} />
            <InfoRow icon={<Hash className="w-4 h-4 text-violet-400" />} label="USN" value={user.usn || "Not provided"} mono />
            <InfoRow icon={<Calendar className="w-4 h-4 text-muted-foreground" />} label="Joined" value={new Date(user.createdAt).toLocaleDateString()} />
          </CardContent>
        </Card>

        <Card className="bg-card border-card-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Platform Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow icon={<span className="text-yellow-400">🪙</span>} label="Coins" value={String(user.coins)} />
            <InfoRow icon={<span className="text-teal-400">🏘️</span>} label="Communities" value={String(user.communityCount)} />
            <InfoRow icon={<span className="text-orange-400">⚡</span>} label="Weekly Points" value={String(user.weeklyPoints)} />
            {user.skills.length > 0 && (
              <div className="flex gap-1 flex-wrap pt-1">
                {user.skills.map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded-full bg-secondary border border-border text-xs">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Warning Strikes */}
      <Card className="bg-card border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            Warning Strikes ({freshWarnings?.length ?? 0} / 5)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!freshWarnings ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : freshWarnings.length === 0 ? (
            <div className="text-sm text-muted-foreground">No warnings issued yet.</div>
          ) : (
            <div className="space-y-2">
              {freshWarnings.map((w, i) => (
                <div key={w.id} className="flex items-start gap-3 py-2.5 px-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                  <span className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {freshWarnings.length - i}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm leading-snug">{w.description}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                      {w.issuedByUsername && <span>by @{w.issuedByUsername}</span>}
                      <span>{new Date(w.createdAt).toLocaleDateString()}</span>
                    </div>
                    {w.screenshotUrl && (
                      <a href={w.screenshotUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
                        <ExternalLink className="w-2.5 h-2.5" /> View evidence
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity */}
      <Card className="bg-card border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Activity ({user.activities.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.activities.length === 0 ? (
            <div className="text-sm text-muted-foreground">No activity yet.</div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {user.activities.map((a) => (
                <div key={a.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap mt-0.5 ${
                      kindColors[a.kind] || "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {a.kind.replace(/_/g, " ")}
                  </span>
                  <div className="flex-1 text-sm">{a.message}</div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(a.createdAt).toLocaleDateString()}
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

function InfoRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-5 flex-shrink-0">{icon}</span>
      <span className="text-xs text-muted-foreground w-16 flex-shrink-0">{label}</span>
      <span className={`text-sm truncate ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function SingleImageUploader({
  label,
  value,
  onChange,
  aspectHint,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  aspectHint?: string;
}) {
  const authFetch = useAuthenticatedFetch();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (file.size > 10 * 1024 * 1024) { setErr("Max 10 MB"); return; }
    setErr(null); setUploading(true);
    try {
      const urlRes = await authFetch(`${BASE}/api/storage/uploads/request-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!urlRes.ok) throw new Error();
      const { uploadURL, objectPath } = await urlRes.json();
      const putRes = await fetch(uploadURL, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!putRes.ok) throw new Error();
      onChange(`${BASE}/api/storage${objectPath}`);
    } catch { setErr("Upload failed"); } finally { setUploading(false); if (inputRef.current) inputRef.current.value = ""; }
  }

  return (
    <div className="space-y-1">
      <Label className="text-xs">{label} {aspectHint && <span className="text-muted-foreground">({aspectHint})</span>}</Label>
      {value ? (
        <div className="relative rounded-lg overflow-hidden border border-border bg-muted group" style={{ height: aspectHint?.includes("banner") ? 80 : 64, width: aspectHint?.includes("banner") ? "100%" : 64 }}>
          <img src={value} alt={label} className="w-full h-full object-cover" />
          <button type="button" onClick={() => onChange(null)} className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {uploading ? <span className="animate-pulse">Uploading…</span> : <><Upload className="w-3.5 h-3.5" /> Upload image</>}
        </button>
      )}
      {err && <p className="text-xs text-destructive">{err}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
    </div>
  );
}

function CommunityEditPanel({ community, onClose }: { community: Community; onClose: () => void }) {
  const api = useAdminFetch();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    name: community.name,
    description: community.description,
    accentColor: community.accentColor,
    tags: community.tags.join(", "),
    bannerImageUrl: community.bannerImageUrl ?? null as string | null,
    profileImageUrl: community.profileImageUrl ?? null as string | null,
    leaderId: community.leaderId ?? null as number | null,
    leaderUsername: community.leaderUsername ?? null as string | null,
  });
  const [leaderSearch, setLeaderSearch] = useState(community.leaderUsername ?? "");
  const [leaderResults, setLeaderResults] = useState<{ id: number; username: string; usn: string | null; name: string | null; avatarColor: string }[]>([]);
  const [leaderDropdown, setLeaderDropdown] = useState(false);

  const { data: members = [], isLoading: membersLoading } = useQuery<CommunityMember[]>({
    queryKey: ["admin", "community-members", community.id],
    queryFn: () => api.get(`/admin/communities/${community.id}/members`),
  });

  async function searchLeader(q: string) {
    setLeaderSearch(q);
    if (!q.trim()) { setLeaderResults([]); setLeaderDropdown(false); return; }
    try {
      const results = await api.get(`/admin/users/search?q=${encodeURIComponent(q.trim())}`);
      setLeaderResults(results);
      setLeaderDropdown(true);
    } catch { setLeaderResults([]); }
  }

  function selectLeader(u: { id: number; username: string }) {
    setForm((f) => ({ ...f, leaderId: u.id, leaderUsername: u.username }));
    setLeaderSearch(u.username);
    setLeaderDropdown(false);
  }

  function clearLeader() {
    setForm((f) => ({ ...f, leaderId: null, leaderUsername: null }));
    setLeaderSearch("");
    setLeaderResults([]);
    setLeaderDropdown(false);
  }

  const updateMutation = useMutation({
    mutationFn: () =>
      api.patch(`/admin/communities/${community.id}`, {
        name: form.name.trim(),
        description: form.description.trim(),
        accentColor: form.accentColor,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        bannerImageUrl: form.bannerImageUrl,
        profileImageUrl: form.profileImageUrl,
        leaderId: form.leaderId,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "communities"] });
      onClose();
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) => api.del(`/admin/communities/${community.id}/members/${userId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "community-members", community.id] }),
  });

  return (
    <Card className="bg-card border-primary/40 border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2"><Pencil className="w-3.5 h-3.5" /> Edit "{community.name}"</span>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Name</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <SingleImageUploader
            label="Banner Image"
            aspectHint="banner, 16:9 recommended"
            value={form.bannerImageUrl}
            onChange={(url) => setForm((f) => ({ ...f, bannerImageUrl: url }))}
          />
          <SingleImageUploader
            label="Profile Picture"
            aspectHint="square, 1:1 recommended"
            value={form.profileImageUrl}
            onChange={(url) => setForm((f) => ({ ...f, profileImageUrl: url }))}
          />
          <div className="space-y-1">
            <Label className="text-xs">Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Community Leader</Label>
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, username or USN…"
                    value={leaderSearch}
                    onChange={(e) => searchLeader(e.target.value)}
                    onFocus={() => leaderResults.length > 0 && setLeaderDropdown(true)}
                    className="pl-8 text-sm h-9"
                  />
                </div>
                {form.leaderId && (
                  <Button type="button" variant="ghost" size="sm" className="h-9 px-2 text-muted-foreground hover:text-destructive" onClick={clearLeader}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {leaderDropdown && leaderResults.length > 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-card shadow-xl overflow-hidden">
                  {leaderResults.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => selectLeader(u)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-secondary/60 transition-colors text-left"
                    >
                      <Avatar className="w-6 h-6 flex-shrink-0">
                        <AvatarFallback style={{ backgroundColor: u.avatarColor }} className="text-white text-[10px] font-bold">
                          {u.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">@{u.username}</div>
                        {u.usn && <div className="text-xs text-muted-foreground">{u.usn}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {form.leaderId && (
              <p className="text-xs text-emerald-400">✓ Leader set to @{form.leaderUsername}</p>
            )}
            {!form.leaderId && (
              <p className="text-xs text-muted-foreground">No leader assigned. Search to assign one.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Accent Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.accentColor}
                  onChange={(e) => setForm((f) => ({ ...f, accentColor: e.target.value }))}
                  className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent"
                />
                <Input value={form.accentColor} onChange={(e) => setForm((f) => ({ ...f, accentColor: e.target.value }))} className="font-mono text-xs" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tags (comma-separated)</Label>
              <Input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="coding, tech" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" disabled={!form.name || !form.description || updateMutation.isPending} onClick={() => updateMutation.mutate()}>
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Users className="w-3.5 h-3.5" /> Members ({members.length})
          </div>
          {membersLoading ? (
            <div className="text-xs text-muted-foreground">Loading members…</div>
          ) : members.length === 0 ? (
            <div className="text-xs text-muted-foreground">No members yet.</div>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg hover:bg-secondary/40 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="w-6 h-6 flex-shrink-0">
                      <AvatarFallback style={{ backgroundColor: m.avatarColor ?? "#7c5cff" }} className="text-white text-[10px] font-bold">
                        {m.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate">@{m.username}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{new Date(m.joinedAt).toLocaleDateString()}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive flex-shrink-0"
                    disabled={removeMemberMutation.isPending}
                    onClick={() => { if (confirm(`Remove @${m.username} from this community?`)) removeMemberMutation.mutate(m.id); }}
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CommunitiesTab() {
  const api = useAdminFetch();
  const qc = useQueryClient();
  const { data: communities = [], isLoading } = useQuery<Community[]>({
    queryKey: ["admin", "communities"],
    queryFn: () => api.get("/communities"),
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "", slug: "", description: "", accentColor: "#7c5cff", tags: "",
    bannerImageUrl: null as string | null,
    profileImageUrl: null as string | null,
    leaderId: null as number | null,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/admin/communities", {
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase().replace(/\s+/g, "-"),
        description: form.description.trim(),
        accentColor: form.accentColor,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        bannerImageUrl: form.bannerImageUrl,
        profileImageUrl: form.profileImageUrl,
        leaderId: form.leaderId,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "communities"] });
      setShowForm(false);
      setForm({ name: "", slug: "", description: "", accentColor: "#7c5cff", tags: "", bannerImageUrl: null, profileImageUrl: null, leaderId: null });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.del(`/admin/communities/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "communities"] }),
  });

  if (isLoading) return <div className="text-muted-foreground text-sm">Loading…</div>;

  const editingCommunity = editingId != null ? communities.find((c) => c.id === editingId) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{communities.length} communities</div>
        <Button size="sm" onClick={() => { setShowForm(!showForm); setEditingId(null); }}>
          <PlusCircle className="w-4 h-4 mr-1.5" /> New Community
        </Button>
      </div>

      {editingCommunity && (
        <CommunityEditPanel community={editingCommunity} onClose={() => setEditingId(null)} />
      )}

      {showForm && !editingCommunity && (
        <Card className="bg-card border-card-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Create Community
              <button onClick={() => setShowForm(false)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((f) => ({
                      ...f,
                      name,
                      slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
                    }));
                  }}
                  placeholder="Computer Science Club"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Slug (URL)</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="computer-science-club"
                />
              </div>
            </div>
            <SingleImageUploader
              label="Banner Image"
              aspectHint="banner, 16:9 recommended"
              value={form.bannerImageUrl}
              onChange={(url) => setForm((f) => ({ ...f, bannerImageUrl: url }))}
            />
            <SingleImageUploader
              label="Profile Picture"
              aspectHint="square, 1:1 recommended"
              value={form.profileImageUrl}
              onChange={(url) => setForm((f) => ({ ...f, profileImageUrl: url }))}
            />
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="What is this community about?"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Accent Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.accentColor}
                    onChange={(e) => setForm((f) => ({ ...f, accentColor: e.target.value }))}
                    className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent"
                  />
                  <Input
                    value={form.accentColor}
                    onChange={(e) => setForm((f) => ({ ...f, accentColor: e.target.value }))}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tags (comma-separated)</Label>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="coding, tech, cs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!form.name || !form.slug || !form.description || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? "Creating…" : "Create Community"}
              </Button>
            </div>
            {createMutation.isError && (
              <p className="text-xs text-destructive">Failed — slug may already be taken.</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {communities.map((c) => (
          <Card key={c.id} className={`bg-card border-card-border transition-colors ${editingId === c.id ? "border-primary/40" : ""}`}>
            <CardContent className="py-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-lg flex-shrink-0 mt-0.5 overflow-hidden flex items-center justify-center"
                  style={{ background: c.accentColor + "33", border: `2px solid ${c.accentColor}44` }}
                >
                  {c.profileImageUrl
                    ? <img src={c.profileImageUrl} alt={c.name} className="w-full h-full object-cover" />
                    : <ImageIcon className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm">{c.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{c.description}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {c.tags.slice(0, 3).map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded bg-secondary text-[10px]">
                        {t}
                      </span>
                    ))}
                    {c.memberCount != null && (
                      <span className="px-1.5 py-0.5 rounded bg-secondary text-[10px] text-muted-foreground">
                        {c.memberCount} members
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => setEditingId(editingId === c.id ? null : c.id)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive h-7 w-7 p-0"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (confirm(`Delete "${c.name}"?`)) deleteMutation.mutate(c.id);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MarketplaceTab() {
  const api = useAdminFetch();
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery<MarketplaceItem[]>({
    queryKey: ["admin", "marketplace"],
    queryFn: () => api.get("/admin/marketplace"),
  });

  const [editing, setEditing] = useState<MarketplaceItem | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", price: "", category: "", contactInfo: "" });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.del(`/admin/marketplace/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "marketplace"] }),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      api.patch(`/admin/marketplace/${editing!.id}`, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        price: parseFloat(editForm.price),
        category: editForm.category.trim(),
        contactInfo: editForm.contactInfo.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "marketplace"] });
      setEditing(null);
    },
  });

  function startEdit(item: MarketplaceItem) {
    setEditing(item);
    setEditForm({
      title: item.title,
      description: item.description,
      price: String(item.price),
      category: item.category,
      contactInfo: item.contactInfo || "",
    });
  }

  if (isLoading) return <div className="text-muted-foreground text-sm">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="text-xs text-muted-foreground">{items.length} listings</div>

      {editing && (
        <Card className="bg-card border-card-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Edit Listing
              <button onClick={() => setEditing(null)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Title</Label>
                <Input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Price (₹)</Label>
                <Input type="number" value={editForm.price} onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Textarea rows={2} value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <Input value={editForm.category} onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Contact Info</Label>
                <Input value={editForm.contactInfo} onChange={(e) => setEditForm((f) => ({ ...f, contactInfo: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
              <Button size="sm" disabled={updateMutation.isPending} onClick={() => updateMutation.mutate()}>
                {updateMutation.isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Seller</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Price</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                <td className="px-4 py-3 font-medium max-w-48 truncate">{item.title}</td>
                <td className="px-4 py-3 text-muted-foreground">@{item.sellerUsername}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full bg-secondary text-xs">{item.category}</span>
                </td>
                <td className="px-4 py-3 font-medium">₹{item.price}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => startEdit(item)}>
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (confirm(`Delete "${item.title}"?`)) deleteMutation.mutate(item.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">No marketplace listings.</div>
        )}
      </div>
    </div>
  );
}

function FreelanceTab() {
  const api = useAdminFetch();
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery<FreelanceItem[]>({
    queryKey: ["admin", "freelance"],
    queryFn: () => api.get("/admin/freelance"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.del(`/admin/freelance/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "freelance"] }),
  });

  if (isLoading) return <div className="text-muted-foreground text-sm">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="text-xs text-muted-foreground">{items.length} services</div>
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Provider</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Price</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                <td className="px-4 py-3 font-medium max-w-48 truncate">{item.title}</td>
                <td className="px-4 py-3 text-muted-foreground">@{item.providerUsername}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full bg-secondary text-xs">{item.category}</span>
                </td>
                <td className="px-4 py-3 font-medium">₹{item.price}</td>
                <td className="px-4 py-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm(`Delete "${item.title}"?`)) deleteMutation.mutate(item.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">No freelance services.</div>
        )}
      </div>
    </div>
  );
}

function ApplicationsTab({ isAdmin }: { isAdmin: boolean }) {
  const api = useAdminFetch();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [rejectTarget, setRejectTarget] = useState<Application | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [docViewer, setDocViewer] = useState<{ url: string; label: string } | null>(null);
  const [zoom, setZoom] = useState(1);

  const { data: applications = [], isLoading, refetch } = useQuery<Application[]>({
    queryKey: ["admin", "applications", statusFilter],
    queryFn: () => api.get(`/admin/applications?status=${statusFilter === "all" ? "" : statusFilter}`),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => api.post(`/admin/applications/${id}/approve`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "applications"] }); void refetch(); },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api.post(`/admin/applications/${id}/reject`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "applications"] });
      void refetch();
      setRejectTarget(null);
      setRejectReason("");
    },
  });

  const filtered = applications.filter((a) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      a.name?.toLowerCase().includes(s) ||
      a.usn?.toLowerCase().includes(s) ||
      a.email?.toLowerCase().includes(s)
    );
  });

  const storageUrl = (path: string | null) =>
    path ? `${BASE}/api/storage${path}` : null;

  function statusBadge(status: string) {
    if (status === "pending")
      return <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[10px] font-bold uppercase tracking-wider">Pending</span>;
    if (status === "approved")
      return <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">Approved</span>;
    return <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold uppercase tracking-wider">Rejected</span>;
  }

  if (isLoading) return <div className="text-muted-foreground text-sm">Loading…</div>;

  const isPdf = (url: string) => url.toLowerCase().includes(".pdf") || url.toLowerCase().includes("pdf");

  return (
    <div className="space-y-4">
      {docViewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => { setDocViewer(null); setZoom(1); }}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">{docViewer.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Zoom out">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom((z) => Math.min(3, z + 0.25))} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Zoom in">
                  <ZoomIn className="w-4 h-4" />
                </button>
                <a href={docViewer.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground" title="Open in new tab">
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button onClick={() => { setDocViewer(null); setZoom(1); }} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-start justify-center min-h-0">
              {isPdf(docViewer.url) ? (
                <iframe
                  src={docViewer.url}
                  className="w-full rounded-lg border border-border"
                  style={{ height: `calc(70vh * ${zoom})`, minHeight: "400px", transform: "none" }}
                  title={docViewer.label}
                />
              ) : (
                <img
                  src={docViewer.url}
                  alt={docViewer.label}
                  className="rounded-lg border border-border max-w-none shadow-lg"
                  style={{ width: `${zoom * 100}%`, maxWidth: "none" }}
                />
              )}
            </div>
          </div>
        </div>
      )}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="font-bold text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                Reject Application
              </div>
              <button onClick={() => { setRejectTarget(null); setRejectReason(""); }}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Rejecting <span className="text-foreground font-semibold">{rejectTarget.name}</span> ({rejectTarget.usn})
            </p>
            <Textarea
              placeholder="Reason for rejection (will be shown to the student)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => { setRejectTarget(null); setRejectReason(""); }}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                onClick={() => rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason.trim() })}
              >
                {rejectMutation.isPending ? "Rejecting…" : "Reject"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, USN, or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 p-1 bg-secondary rounded-lg">
          {(["pending", "approved", "rejected", "all"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize ${
                statusFilter === s
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        {filtered.length} application{filtered.length !== 1 ? "s" : ""}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No applications found.</div>
        )}
        {filtered.map((app) => (
          <Card key={app.id} className="bg-card border-card-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarFallback style={{ backgroundColor: app.avatarColor }} className="text-white font-semibold">
                    {app.name?.[0]?.toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{app.name}</span>
                    {statusBadge(app.accountStatus)}
                    {app.accountStatus === "approved" && app.reviewerUsername && (
                      <span className="text-[10px] text-muted-foreground">
                        by @{app.reviewerUsername} ({app.reviewerRole})
                      </span>
                    )}
                    {app.accountStatus === "rejected" && app.reviewerUsername && (
                      <span className="text-[10px] text-muted-foreground">
                        by @{app.reviewerUsername}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                    <span className="text-xs font-mono text-muted-foreground">{app.usn}</span>
                    <span className="text-xs text-muted-foreground">{app.email}</span>
                    {app.branch && <span className="text-xs text-muted-foreground">{app.branch} · Sem {app.semester}</span>}
                  </div>
                  {app.accountStatus === "rejected" && app.rejectionReason && (
                    <div className="mt-1 text-xs text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">
                      Reason: {app.rejectionReason}
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground shrink-0 text-right">
                  {new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {app.accountStatus === "pending" && (
                  <div className="flex gap-2 ml-auto">
                    <Button
                      size="sm"
                      className="h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                      disabled={approveMutation.isPending}
                      onClick={() => approveMutation.mutate(app.id)}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 px-3 text-xs gap-1"
                      onClick={() => { setRejectTarget(app); setRejectReason(""); }}
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject
                    </Button>
                  </div>
                )}
                {app.accountStatus !== "pending" && isAdmin && (
                  <div className="flex gap-2 ml-auto">
                    {app.accountStatus !== "approved" && (
                      <Button
                        size="sm"
                        className="h-7 px-3 text-xs bg-emerald-600/80 hover:bg-emerald-700 text-white gap-1"
                        disabled={approveMutation.isPending}
                        onClick={() => approveMutation.mutate(app.id)}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Re-approve
                      </Button>
                    )}
                    {app.accountStatus !== "rejected" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-3 text-xs text-destructive hover:text-destructive gap-1"
                        onClick={() => { setRejectTarget(app); setRejectReason(""); }}
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border/50">
                {(
                  [
                    { label: "College ID Card", url: storageUrl(app.idCardUrl) },
                    { label: "Fee Receipt", url: storageUrl(app.feeReceiptUrl) },
                  ] as { label: string; url: string | null }[]
                ).map(({ label, url }) => (
                  <div key={label} className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">{label}</div>
                    {url ? (
                      <button
                        onClick={() => { setZoom(1); setDocViewer({ url, label }); }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-secondary/40 hover:bg-secondary/70 transition-colors text-xs text-primary w-full text-left"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Open document
                      </button>
                    ) : (
                      <div className="px-3 py-2 rounded-lg border border-border bg-secondary/40 text-xs text-muted-foreground">
                        Not uploaded
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ReportsTab({ isAdmin }: { isAdmin: boolean }) {
  const api = useAdminFetch();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [reviewTarget, setReviewTarget] = useState<Report | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewStatus, setReviewStatus] = useState<"reviewed" | "dismissed">("reviewed");
  const [showWarnBan, setShowWarnBan] = useState(false);

  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ["admin", "reports"],
    queryFn: () => api.get("/admin/reports"),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: number; status: string; note: string }) =>
      api.patch(`/admin/reports/${id}`, { status, reviewNote: note || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reports"] });
      setReviewTarget(null);
      setReviewNote("");
      setShowWarnBan(false);
    },
  });

  const banMutation = useMutation({
    mutationFn: ({ id, isBanned, banDuration }: { id: number; isBanned: boolean; banDuration?: string }) =>
      api.patch(`/admin/users/${id}`, { isBanned, ...(banDuration ? { banDuration } : {}) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reports"] });
      setShowWarnBan(false);
    },
  });

  const filtered = reports.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.targetType.includes(s) ||
      r.description.toLowerCase().includes(s) ||
      r.reporterUsername?.toLowerCase().includes(s) ||
      r.targetUsn?.toLowerCase().includes(s)
    );
  });

  function typeBadge(type: string) {
    const colors: Record<string, string> = {
      post: "bg-sky-500/20 text-sky-400 border-sky-500/30",
      marketplace: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      freelance: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      hackathon: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      usn_conflict: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    };
    const cls = colors[type] ?? "bg-secondary text-muted-foreground border-border";
    return (
      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${cls}`}>
        {type.replace("_", " ")}
      </span>
    );
  }

  function statusBadge(status: string) {
    if (status === "pending")
      return <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400">● Pending</span>;
    if (status === "reviewed")
      return <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">✓ Reviewed</span>;
    return <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">— Dismissed</span>;
  }

  if (isLoading) return <div className="text-muted-foreground text-sm">Loading…</div>;

  return (
    <div className="space-y-4">
      {/* Warn/Ban overlay — shown on top of the review modal */}
      {reviewTarget && showWarnBan && reviewTarget.reportedUserId && reviewTarget.reportedUsername && (
        <WarningBanModal
          userId={reviewTarget.reportedUserId}
          username={reviewTarget.reportedUsername}
          onWarnSuccess={() => { setShowWarnBan(false); qc.invalidateQueries({ queryKey: ["admin", "reports"] }); }}
          onBanConfirm={(duration) => banMutation.mutate({ id: reviewTarget.reportedUserId!, isBanned: true, banDuration: duration })}
          onCancel={() => setShowWarnBan(false)}
        />
      )}

      {reviewTarget && !showWarnBan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-2">
              <div className="font-bold text-base flex items-center gap-2">
                <Flag className="w-4 h-4 text-yellow-400" />
                Review Report #{reviewTarget.id}
              </div>
              <button onClick={() => { setReviewTarget(null); setReviewNote(""); setShowWarnBan(false); }}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Report details */}
            <div className="space-y-1 text-xs text-muted-foreground bg-secondary/40 rounded-lg p-3">
              <div><span className="text-foreground font-medium">Type: </span>{reviewTarget.targetType}</div>
              {reviewTarget.targetId && <div><span className="text-foreground font-medium">Target ID: </span>#{reviewTarget.targetId}</div>}
              {reviewTarget.targetUsn && <div><span className="text-foreground font-medium">USN: </span>{reviewTarget.targetUsn}</div>}
              {reviewTarget.reportedUsername && (
                <div><span className="text-foreground font-medium">Reported User: </span>@{reviewTarget.reportedUsername}</div>
              )}
              <div className="pt-1"><span className="text-foreground font-medium">Description: </span>{reviewTarget.description}</div>
            </div>

            {/* Warn / Ban student button — only if there's a linked user */}
            {reviewTarget.reportedUserId && reviewTarget.reportedUsername && (
              <div className="border border-yellow-500/20 rounded-xl p-3 bg-yellow-500/5">
                <div className="text-xs text-yellow-400 font-semibold mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Student Actions
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Take moderation action against <span className="text-foreground font-medium">@{reviewTarget.reportedUsername}</span> directly from this report.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-2 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                  onClick={() => setShowWarnBan(true)}
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Warn / Ban Student
                </Button>
              </div>
            )}

            {/* Resolution */}
            <div className="flex gap-2">
              {(["reviewed", "dismissed"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setReviewStatus(s)}
                  className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors capitalize ${
                    reviewStatus === s
                      ? s === "reviewed"
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                        : "border-muted-foreground/50 bg-secondary text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Optional note for your team…"
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={2}
              maxLength={500}
            />
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => { setReviewTarget(null); setReviewNote(""); setShowWarnBan(false); }}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1"
                disabled={reviewMutation.isPending}
                onClick={() => reviewMutation.mutate({ id: reviewTarget.id, status: reviewStatus, note: reviewNote.trim() })}
              >
                {reviewMutation.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search reports by type, description, or reporter…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="text-xs text-muted-foreground">
        {filtered.length} report{filtered.length !== 1 ? "s" : ""}
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Reporter</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                <td className="px-4 py-3">{typeBadge(r.targetType)}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {r.reporterUsername ? `@${r.reporterUsername}` : "Anonymous"}
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>
                </td>
                <td className="px-4 py-3">{statusBadge(r.status)}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </td>
                <td className="px-4 py-3">
                  {r.status === "pending" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => { setReviewTarget(r); setReviewNote(r.reviewNote ?? ""); setReviewStatus("reviewed"); }}
                    >
                      Review
                    </Button>
                  )}
                  {r.status !== "pending" && (
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => { setReviewTarget(r); setReviewNote(r.reviewNote ?? ""); setReviewStatus("reviewed"); }}
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">No reports found.</div>
        )}
      </div>
    </div>
  );
}

function ModeratorsTab() {
  const api = useAdminFetch();
  const qc = useQueryClient();

  const { data: mods = [], isLoading } = useQuery<Moderator[]>({
    queryKey: ["admin", "moderators"],
    queryFn: () => api.get("/admin/moderators"),
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", name: "", email: "" });
  const [showPw, setShowPw] = useState(false);

  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/admin/moderators", {
        username: form.username.trim().toUpperCase(),
        password: form.password,
        name: form.name.trim() || undefined,
        email: form.email.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "moderators"] });
      setShowForm(false);
      setForm({ username: "", password: "", name: "", email: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.del(`/admin/moderators/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "moderators"] }),
  });

  if (isLoading) return <div className="text-muted-foreground text-sm">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{mods.length} moderator{mods.length !== 1 ? "s" : ""}</div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <PlusCircle className="w-4 h-4 mr-1.5" /> Add Moderator
        </Button>
      </div>

      {showForm && (
        <Card className="bg-card border-card-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Create Moderator Account
              <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Username <span className="text-destructive">*</span></Label>
                <Input
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "") }))}
                  placeholder="MOD_USERNAME"
                />
                <p className="text-[10px] text-muted-foreground">Uppercase letters, numbers, underscores only</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Password <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Min 6 characters"
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Display Name</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name (optional)" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="mod@college.edu (optional)" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button
                size="sm"
                disabled={!form.username || form.password.length < 6 || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? "Creating…" : "Create Moderator"}
              </Button>
            </div>
            {createMutation.isError && (
              <p className="text-xs text-destructive">
                Failed — username may already be taken.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Username</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mods.map((m) => (
              <tr key={m.id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {m.username?.[0]?.toUpperCase() ?? "M"}
                    </div>
                    <span className="font-medium">@{m.username}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{m.name ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{m.email ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(m.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive h-7 px-2"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm(`Remove moderator @${m.username}? This will delete their account permanently.`))
                        deleteMutation.mutate(m.id);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {mods.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No moderators yet. Add one to give them access to review applications and reports.
          </div>
        )}
      </div>
    </div>
  );
}

type AdminCategory = { id: number; type: string; name: string; createdAt: string };
type AdminInterest = { id: number; name: string; category: string; emoji: string | null };

function CategoriesTab() {
  const api = useAdminFetch();
  const qc = useQueryClient();
  const [section, setSection] = useState<"marketplace" | "freelance" | "interests">("marketplace");

  const { data: categories = [], isLoading: catsLoading } = useQuery<AdminCategory[]>({
    queryKey: ["admin", "categories"],
    queryFn: () => api.get("/admin/categories"),
  });
  const { data: interests = [], isLoading: intsLoading } = useQuery<AdminInterest[]>({
    queryKey: ["admin", "interests"],
    queryFn: () => api.get("/admin/interests"),
  });

  const [newCatName, setNewCatName] = useState("");
  const [newIntName, setNewIntName] = useState("");
  const [newIntCat, setNewIntCat] = useState("");
  const [newIntEmoji, setNewIntEmoji] = useState("");
  const [editInt, setEditInt] = useState<AdminInterest | null>(null);
  const [saving, setSaving] = useState(false);

  const marketplaceCats = categories.filter((c) => c.type === "marketplace");
  const freelanceCats = categories.filter((c) => c.type === "freelance");

  async function addCategory(type: "marketplace" | "freelance") {
    const name = newCatName.trim();
    if (!name) return;
    setSaving(true);
    try {
      await api.post("/admin/categories", { type, name });
      await qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      setNewCatName("");
    } finally { setSaving(false); }
  }

  async function deleteCategory(id: number) {
    if (!confirm("Delete this category?")) return;
    await api.del(`/admin/categories/${id}`);
    await qc.invalidateQueries({ queryKey: ["admin", "categories"] });
  }

  async function addInterest() {
    const name = newIntName.trim();
    const category = newIntCat.trim();
    if (!name || !category) return;
    setSaving(true);
    try {
      await api.post("/admin/interests", { name, category, emoji: newIntEmoji.trim() || null });
      await qc.invalidateQueries({ queryKey: ["admin", "interests"] });
      setNewIntName(""); setNewIntCat(""); setNewIntEmoji("");
    } finally { setSaving(false); }
  }

  async function saveInterest() {
    if (!editInt) return;
    setSaving(true);
    try {
      await api.patch(`/admin/interests/${editInt.id}`, { name: editInt.name, category: editInt.category, emoji: editInt.emoji || null });
      await qc.invalidateQueries({ queryKey: ["admin", "interests"] });
      setEditInt(null);
    } finally { setSaving(false); }
  }

  async function deleteInterest(id: number) {
    if (!confirm("Delete this skill/interest? Students using it will lose it from their profile.")) return;
    await api.del(`/admin/interests/${id}`);
    await qc.invalidateQueries({ queryKey: ["admin", "interests"] });
  }

  const sectionTabs = [
    { id: "marketplace" as const, label: "Marketplace Categories" },
    { id: "freelance" as const, label: "Freelance Categories" },
    { id: "interests" as const, label: "Skills & Interests" },
  ];

  const currentCats = section === "marketplace" ? marketplaceCats : freelanceCats;
  const intCategories = Array.from(new Set(interests.map((i) => i.category))).sort();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Layers className="w-5 h-5 text-primary" />
        <div>
          <h2 className="text-lg font-bold">Categories & Skills</h2>
          <p className="text-sm text-muted-foreground">Manage categories for marketplace and freelance, plus all available skills/interests.</p>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit flex-wrap">
        {sectionTabs.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
              section === s.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {(section === "marketplace" || section === "freelance") && (
        <Card className="bg-card border-card-border">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder={`New ${section} category name…`}
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCategory(section)}
                className="flex-1"
              />
              <Button disabled={!newCatName.trim() || saving} onClick={() => addCategory(section)} className="gap-1.5 shrink-0">
                <PlusCircle className="w-4 h-4" /> Add
              </Button>
            </div>
            {catsLoading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : currentCats.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6 text-center">No {section} categories yet. Add one above.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {currentCats.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border/50 group">
                    <div className="flex items-center gap-2 min-w-0">
                      <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium truncate">{cat.name}</span>
                    </div>
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      className="shrink-0 p-1 rounded text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {section === "interests" && (
        <div className="space-y-4">
          <Card className="bg-card border-card-border">
            <CardContent className="p-5 space-y-3">
              <div className="text-sm font-semibold">Add New Skill / Interest</div>
              <div className="flex gap-2 flex-wrap">
                <Input placeholder="Emoji (optional)" value={newIntEmoji} onChange={(e) => setNewIntEmoji(e.target.value)} className="w-24 shrink-0" maxLength={8} />
                <Input placeholder="Name (e.g. Machine Learning)" value={newIntName} onChange={(e) => setNewIntName(e.target.value)} className="flex-1 min-w-32" />
                <Input placeholder="Category (e.g. Technology)" value={newIntCat} onChange={(e) => setNewIntCat(e.target.value)} className="flex-1 min-w-32" />
                <Button disabled={!newIntName.trim() || !newIntCat.trim() || saving} onClick={addInterest} className="gap-1.5 shrink-0">
                  <PlusCircle className="w-4 h-4" /> Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {intsLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : intCategories.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">No skills/interests yet. Add one above.</div>
          ) : (
            intCategories.map((cat) => (
              <Card key={cat} className="bg-card border-card-border">
                <CardHeader className="pb-2 pt-4 px-5">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{cat}</CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-4">
                  <div className="flex flex-wrap gap-2">
                    {interests.filter((i) => i.category === cat).map((interest) => (
                      <div
                        key={interest.id}
                        className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/60 border border-border/50 text-sm"
                      >
                        {interest.emoji && <span>{interest.emoji}</span>}
                        <span>{interest.name}</span>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditInt(interest)} className="p-0.5 rounded hover:text-primary transition-colors text-muted-foreground" title="Edit">
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button onClick={() => deleteInterest(interest.id)} className="p-0.5 rounded hover:text-destructive transition-colors text-muted-foreground" title="Delete">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {editInt && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold">Edit Skill / Interest</span>
                  <button onClick={() => setEditInt(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Emoji</Label>
                    <Input value={editInt.emoji ?? ""} onChange={(e) => setEditInt({ ...editInt, emoji: e.target.value })} maxLength={8} placeholder="Optional emoji" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input value={editInt.name} onChange={(e) => setEditInt({ ...editInt, name: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Category</Label>
                    <Input value={editInt.category} onChange={(e) => setEditInt({ ...editInt, category: e.target.value })} className="mt-1" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" className="flex-1" onClick={() => setEditInt(null)}>Cancel</Button>
                  <Button className="flex-1" disabled={saving || !editInt.name.trim()} onClick={saveInterest}>
                    {saving ? "Saving…" : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
