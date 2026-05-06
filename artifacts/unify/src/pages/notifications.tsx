import { Link } from "wouter";
import {
  useGetNotifications,
  useMarkAllNotificationsRead,
  getGetNotificationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthenticatedFetch } from "@/lib/api-fetch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell, Heart, UserPlus, CheckCheck, UserCheck, Check, X, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function NotificationsPage() {
  const qc = useQueryClient();
  const afetch = useAuthenticatedFetch();
  const { toast } = useToast();
  const { data: notifications = [], isLoading } = useGetNotifications();
  const markAll = useMarkAllNotificationsRead();
  const [actionStates, setActionStates] = useState<Record<number, "accepted" | "declined" | null>>({});

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAll = async () => {
    await markAll.mutateAsync();
    qc.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
  };

  async function handleAccept(notifId: number, actorUsername: string) {
    try {
      await afetch(`${BASE}/api/connections/${actorUsername}/follow/accept`, { method: "POST" });
      setActionStates((s) => ({ ...s, [notifId]: "accepted" }));
      toast({ title: `Accepted @${actorUsername}'s follow request` });
      qc.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
    } catch {
      toast({ title: "Failed to accept", variant: "destructive" });
    }
  }

  async function handleDecline(notifId: number, actorUsername: string) {
    try {
      await afetch(`${BASE}/api/connections/${actorUsername}/follow/decline`, { method: "POST" });
      setActionStates((s) => ({ ...s, [notifId]: "declined" }));
      toast({ title: `Declined @${actorUsername}'s follow request` });
    } catch {
      toast({ title: "Failed to decline", variant: "destructive" });
    }
  }

  function getIcon(type: string) {
    if (type === "like") return { Icon: Heart, bg: "bg-rose-500" };
    if (type === "comment") return { Icon: MessageCircle, bg: "bg-sky-500" };
    if (type === "follow_request") return { Icon: UserPlus, bg: "bg-amber-500" };
    if (type === "follow_accepted") return { Icon: UserCheck, bg: "bg-emerald-500" };
    return { Icon: UserPlus, bg: "bg-primary" };
  }

  function getMessage(type: string) {
    if (type === "like") return "liked your post";
    if (type === "comment") return "commented on your post";
    if (type === "follow_request") return "wants to follow you";
    if (type === "follow_accepted") return "accepted your follow request";
    return "started following you";
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" /> Notifications
          {unreadCount > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {unreadCount}
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAll} disabled={markAll.isPending}>
            <CheckCheck className="w-4 h-4 mr-2" /> Mark all read
          </Button>
        )}
      </div>

      {isLoading && <div className="text-center text-muted-foreground py-16 text-sm">Loading notifications…</div>}

      {!isLoading && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <Bell className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">No notifications yet — follow people and post to get the party started.</p>
        </div>
      )}

      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((n) => {
            const { Icon, bg } = getIcon(n.type);
            const actionState = actionStates[n.id];
            const isFollowRequest = n.type === "follow_request";

            return (
              <div
                key={n.id}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${n.read ? "bg-card border-card-border" : "bg-primary/5 border-primary/20"}`}
              >
                <div className="relative flex-shrink-0">
                  <Link href={`/users/${n.actor.username}`}>
                    <Avatar className="w-10 h-10 hover:opacity-80 transition-opacity">
                      <AvatarFallback style={{ backgroundColor: n.actor.avatarColor }} className="text-white text-sm font-semibold">
                        {n.actor.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${bg}`}>
                    <Icon className="w-3 h-3 text-white" fill={n.type === "like" ? "white" : "none"} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <Link href={`/users/${n.actor.username}`} className="font-semibold hover:text-primary transition-colors">
                      @{n.actor.username}
                    </Link>{" "}
                    {getMessage(n.type)}
                  </p>
                  {n.post && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">"{n.post.body}"</p>}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>

                  {/* Follow request actions */}
                  {isFollowRequest && (
                    <div className="mt-3">
                      {actionState === "accepted" ? (
                        <span className="text-xs text-emerald-400 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Accepted</span>
                      ) : actionState === "declined" ? (
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><X className="w-3.5 h-3.5" /> Declined</span>
                      ) : (
                        <div className="flex gap-2">
                          <Button size="sm" className="h-7 text-xs px-3" onClick={() => handleAccept(n.id, n.actor.username)}>
                            <Check className="w-3 h-3 mr-1" /> Accept
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs px-3" onClick={() => handleDecline(n.id, n.actor.username)}>
                            <X className="w-3 h-3 mr-1" /> Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
