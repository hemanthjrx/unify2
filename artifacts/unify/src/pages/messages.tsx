import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuthenticatedFetch } from "@/lib/api-fetch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useGetMyProfile } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";
import {
  Send, Paperclip, Image as ImageIcon, FileText, Lock, MessageCircle, ArrowLeft,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Conversation {
  username: string;
  avatarColor: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  isAccepted: boolean;
}

interface Message {
  id: number;
  senderId: number;
  body: string | null;
  kind: string;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
  isMine: boolean;
}

interface ConversationData {
  messages: Message[];
  isAccepted: boolean;
  pendingMsgCount: number;
  maxPendingMessages: number;
  isFrozen: boolean;
}

export default function MessagesPage() {
  const afetch = useAuthenticatedFetch();
  const { toast } = useToast();
  const { data: me } = useGetMyProfile();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/messages/:username");
  const activeUsername = params?.username ?? null;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convData, setConvData] = useState<ConversationData | null>(null);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const r = await afetch(`${BASE}/api/messages/conversations`);
      const data = await r.json();
      setConversations(data);
    } finally {
      setLoadingConvs(false);
    }
  }, [afetch]);

  const loadMessages = useCallback(async (username: string) => {
    setLoadingMsgs(true);
    try {
      const r = await afetch(`${BASE}/api/messages/conversations/${username}`);
      if (!r.ok) throw new Error();
      const data = await r.json();
      setConvData(data);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch {
      toast({ title: "Couldn't load messages", variant: "destructive" });
    } finally {
      setLoadingMsgs(false);
    }
  }, [afetch, toast]);

  useEffect(() => { loadConversations(); }, [loadConversations]);
  useEffect(() => { if (activeUsername) loadMessages(activeUsername); }, [activeUsername, loadMessages]);

  async function sendText() {
    if (!text.trim() || !activeUsername || sending) return;
    setSending(true);
    try {
      const r = await afetch(`${BASE}/api/messages/conversations/${activeUsername}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text.trim(), kind: "text" }),
      });
      if (!r.ok) {
        const err = await r.json();
        toast({ title: err.message || "Cannot send message", variant: "destructive" });
        return;
      }
      const msg = await r.json();
      setConvData((d) => d ? { ...d, messages: [...d.messages, msg], pendingMsgCount: d.pendingMsgCount + 1 } : d);
      setText("");
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      loadConversations();
    } finally {
      setSending(false);
    }
  }

  async function uploadFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const allowed = ["jpg", "jpeg", "png", "gif", "webp", "pdf", "doc", "docx"];
    if (!allowed.includes(ext)) { toast({ title: "File type not allowed. Use images, PDFs, or documents.", variant: "destructive" }); return; }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const r = await afetch(`${BASE}/api/messages/upload`, { method: "POST", body: form });
      if (!r.ok) throw new Error();
      const { url, name, kind } = await r.json();

      const r2 = await afetch(`${BASE}/api/messages/conversations/${activeUsername}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, fileUrl: url, fileName: name }),
      });
      if (!r2.ok) { const e = await r2.json(); toast({ title: e.message || "Cannot send", variant: "destructive" }); return; }
      const msg = await r2.json();
      setConvData((d) => d ? { ...d, messages: [...d.messages, msg] } : d);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      loadConversations();
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  const isFrozen = convData?.isFrozen ?? false;
  const remaining = convData ? Math.max(0, convData.maxPendingMessages - convData.pendingMsgCount) : 0;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Conversation list */}
      <div className={`w-80 border-r border-border flex-shrink-0 flex flex-col ${activeUsername ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b border-border">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" /> Messages
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConvs && <div className="p-6 text-center text-sm text-muted-foreground">Loading…</div>}
          {!loadingConvs && conversations.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground space-y-2">
              <MessageCircle className="w-10 h-10 mx-auto text-muted-foreground/40" />
              <p>No conversations yet.</p>
              <p className="text-xs">Send a follow request to someone, then message them from their profile.</p>
            </div>
          )}
          {conversations.map((conv) => (
            <div
              key={conv.username}
              className={`w-full flex items-center gap-3 px-4 py-3 border-b border-border/40 ${activeUsername === conv.username ? "bg-primary/10 border-l-2 border-l-primary" : ""}`}
            >
              <button
                onClick={() => navigate(`/users/${conv.username}`)}
                className="relative flex-shrink-0 hover:opacity-80 transition-opacity"
                title={`View @${conv.username}'s profile`}
              >
                <Avatar className="w-10 h-10">
                  <AvatarFallback style={{ backgroundColor: conv.avatarColor }} className="text-white text-sm font-semibold">
                    {conv.username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {!conv.isAccepted && <Lock className="absolute -bottom-1 -right-1 w-3.5 h-3.5 text-yellow-400 bg-background rounded-full" />}
              </button>
              <button
                onClick={() => navigate(`/messages/${conv.username}`)}
                className="flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm truncate">@{conv.username}</span>
                  {conv.unreadCount > 0 && (
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                {conv.lastMessage && <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>}
                {conv.lastMessageAt && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}</p>}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat panel */}
      {activeUsername ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/50 flex-shrink-0">
            <button onClick={() => navigate("/messages")} className="md:hidden text-muted-foreground hover:text-foreground mr-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate(`/users/${activeUsername}`)}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Avatar className="w-9 h-9">
                <AvatarFallback style={{ backgroundColor: conversations.find((c) => c.username === activeUsername)?.avatarColor ?? "#7c5cff" }} className="text-white text-sm font-semibold">
                  {activeUsername[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <div className="font-semibold text-sm hover:text-primary transition-colors">@{activeUsername}</div>
                {convData && !convData.isAccepted && (
                  <div className="text-xs text-yellow-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Pending follow request
                  </div>
                )}
              </div>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loadingMsgs && <div className="text-center text-muted-foreground text-sm py-10">Loading messages…</div>}
            {!loadingMsgs && convData && convData.messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-10">Say hello!</div>
            )}
            {convData?.messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-2.5 ${msg.isMine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border border-border rounded-bl-sm"}`}>
                  {msg.kind === "text" && <p className="text-sm leading-relaxed">{msg.body}</p>}
                  {msg.kind === "image" && msg.fileUrl && (
                    <img src={msg.fileUrl} alt={msg.fileName ?? "image"} className="rounded-lg max-w-full max-h-60 object-cover" />
                  )}
                  {(msg.kind === "pdf" || msg.kind === "document") && msg.fileUrl && (
                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 text-sm hover:underline ${msg.isMine ? "text-primary-foreground" : "text-foreground"}`}>
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate max-w-[200px]">{msg.fileName ?? "File"}</span>
                    </a>
                  )}
                  <p className={`text-[10px] mt-1 ${msg.isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Frozen state */}
          {isFrozen && (
            <div className="mx-4 mb-3 flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <Lock className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <p className="text-xs text-yellow-200/80 leading-relaxed">
                Message limit reached. Waiting for <span className="font-semibold">@{activeUsername}</span> to accept your follow request before you can send more.
              </p>
            </div>
          )}

          {!isFrozen && convData && !convData.isAccepted && (
            <div className="mx-4 mb-2 text-center text-xs text-muted-foreground">
              {remaining} of {convData.maxPendingMessages} messages remaining while follow request is pending
            </div>
          )}

          {/* Input */}
          {!isFrozen && (
            <div className="p-4 border-t border-border bg-card/30 flex items-end gap-2 flex-shrink-0">
              <input ref={fileRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }} />
              <button onClick={() => fileRef.current?.click()} className="flex-shrink-0 p-2 text-muted-foreground hover:text-foreground transition-colors" disabled={uploading} title="Attach image, PDF or document">
                <Paperclip className="w-5 h-5" />
              </button>
              <button onClick={() => { if (fileRef.current) { fileRef.current.accept = ".jpg,.jpeg,.png,.gif,.webp"; fileRef.current.click(); fileRef.current.accept = ".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx"; } }} className="flex-shrink-0 p-2 text-muted-foreground hover:text-foreground transition-colors" title="Send image">
                <ImageIcon className="w-5 h-5" />
              </button>
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(); } }}
                placeholder={uploading ? "Uploading…" : "Type a message…"}
                className="flex-1 bg-secondary border-border text-sm"
                disabled={uploading}
              />
              <Button size="sm" onClick={sendText} disabled={!text.trim() || sending || uploading} className="flex-shrink-0 px-3">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-center text-muted-foreground">
          <div className="space-y-3">
            <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/30" />
            <p className="text-sm">Select a conversation to start chatting</p>
            <p className="text-xs text-muted-foreground/60">Send a follow request to a student, then message them from their profile.</p>
          </div>
        </div>
      )}
    </div>
  );
}
