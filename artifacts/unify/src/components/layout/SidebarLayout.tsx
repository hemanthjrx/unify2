import { Link, useLocation } from "wouter";
import {
  Home,
  Compass,
  Users,
  User as UserIcon,
  LogOut,
  Coins,
  Sparkles,
  Bell,
  Search,
  ShoppingBag,
  Briefcase,
  Shield,
  Zap,
  MessageCircle,
  GraduationCap,
  Megaphone,
} from "lucide-react";
import { useGetMyProfile, useGetNotifications } from "@workspace/api-client-react";
import { useAuthenticatedFetch } from "@/lib/api-fetch";
import { useAppAuth } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout } = useAppAuth();
  const { data: profile } = useGetMyProfile();
  const { data: notifications = [] } = useGetNotifications();
  const afetch = useAuthenticatedFetch();
  const qc = useQueryClient();
  const [unreadMessages, setUnreadMessages] = useState(0);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    let cancelled = false;
    async function fetchUnread() {
      try {
        const r = await afetch(`${BASE}/api/messages/conversations`);
        if (!r.ok || cancelled) return;
        const convs = await r.json() as { unreadCount: number }[];
        setUnreadMessages(convs.reduce((s, c) => s + (c.unreadCount ?? 0), 0));
      } catch {}
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [afetch]);

  const navItems = [
    { label: "Dashboard",   href: "/dashboard",   icon: Home,          color: "#a78bfa", match: (l: string) => l === "/dashboard" || l === "/" },
    { label: "Discover",    href: "/discover",    icon: Compass,       color: "#34d399", match: (l: string) => l.startsWith("/discover") || l.startsWith("/users/") },
    { label: "Communities", href: "/communities", icon: Users,         color: "#60a5fa", match: (l: string) => l.startsWith("/communities") },
    { label: "Hackathons",  href: "/hackathons",  icon: Zap,           color: "#fbbf24", match: (l: string) => l.startsWith("/hackathons") },
    { label: "Search",      href: "/search",      icon: Search,        color: "#f472b6", match: (l: string) => l.startsWith("/search") },
    { label: "Marketplace", href: "/marketplace", icon: ShoppingBag,   color: "#fb923c", match: (l: string) => l.startsWith("/marketplace") },
    { label: "Freelance",   href: "/freelance",   icon: Briefcase,     color: "#2dd4bf", match: (l: string) => l.startsWith("/freelance") },
    { label: "Mentorship",      href: "/mentorship",      icon: GraduationCap, color: "#c084fc", match: (l: string) => l.startsWith("/mentorship") },
    { label: "Announcements",   href: "/announcements",   icon: Megaphone,     color: "#f87171", match: (l: string) => l.startsWith("/announcements") },
    { label: "Profile",         href: "/profile",         icon: UserIcon,      color: "#94a3b8", match: (l: string) => l === "/profile" },
  ];

  const isAdmin = profile?.role === "admin";

  const initial =
    profile?.username?.[0]?.toUpperCase() ||
    profile?.name?.[0]?.toUpperCase() ||
    "?";

  function handleSignOut() {
    qc.clear();
    logout();
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="p-5 flex items-center gap-3 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight leading-none">Unify</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Student Networking</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.match(location);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                }`}
                data-testid={`link-sidebar-${item.label.toLowerCase()}`}
              >
                <Icon className="w-4 h-4 shrink-0" style={{ color: item.color }} />
                {item.label}
              </Link>
            );
          })}

          {/* Messages */}
          <Link
            href="/messages"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
              location.startsWith("/messages")
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            }`}
          >
            <div className="relative shrink-0">
              <MessageCircle className="w-4 h-4" style={{ color: "#38bdf8" }} />
              {unreadMessages > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-sky-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
            </div>
            Messages
            {unreadMessages > 0 && (
              <span className="ml-auto px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold">
                {unreadMessages}
              </span>
            )}
          </Link>

          {/* Notifications */}
          <Link
            href="/notifications"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
              location.startsWith("/notifications")
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            }`}
            data-testid="link-sidebar-notifications"
          >
            <div className="relative shrink-0">
              <Bell className="w-4 h-4" style={{ color: "#fde68a" }} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            Notifications
            {unreadCount > 0 && (
              <span className="ml-auto px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                location.startsWith("/admin")
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              }`}
              data-testid="link-sidebar-admin"
            >
              <Shield className="w-4 h-4 shrink-0" style={{ color: "#fb923c" }} />
              Admin Panel
            </Link>
          )}
        </nav>

        <div className="p-3 border-t border-sidebar-border space-y-3">
          {profile && (
            <div className="flex items-center justify-between px-3 py-2 bg-sidebar-accent/40 rounded-lg border border-sidebar-border">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="font-semibold text-sm" data-testid="text-nav-coins">{profile.coins}</span>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Coins</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="w-9 h-9 ring-2 ring-offset-2 ring-offset-sidebar" style={{ ["--tw-ring-color" as never]: profile?.avatarColor || "#7c5cff" }}>
                <AvatarFallback style={{ backgroundColor: profile?.avatarColor || "#7c5cff" }} className="text-white text-sm font-semibold">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium leading-tight truncate" data-testid="text-nav-username">
                  {profile?.username || profile?.name || "Student"}
                </span>
                <span className="text-[11px] text-muted-foreground leading-tight truncate">
                  {profile?.role === "admin" ? "Admin" : "Student"}
                </span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-sidebar-accent"
              data-testid="button-sign-out"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-background">{children}</main>
    </div>
  );
}
