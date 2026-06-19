import { useEffect, useMemo, useRef, useState } from "react";
import {
  useGetMyProfile,
  useGetUserPosts,
  useListInterests,
  useUpdateMyProfile,
  getGetMyProfileQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PostCard } from "@/components/PostCard";
import {
  Coins,
  Users,
  UserCheck,
  X,
  Save,
  Sparkles,
  Camera,
  ImageIcon,
  Check,
  ExternalLink,
  Globe,
  Linkedin,
  Github,
  Pencil,
  AlertTriangle,
  Clock,
} from "lucide-react";

const BRANCHES = [
  { code: "AD", name: "Artificial Intelligence and Data Science" },
  { code: "AI", name: "Artificial Intelligence and Machine Learning" },
  { code: "CE", name: "Civil Engineering" },
  { code: "AM", name: "Computer Science and Engineering (AI & ML)" },
  { code: "IC", name: "Computer Science and Engineering (IoT & Cyber Security)" },
  { code: "CS", name: "Computer Science and Engineering" },
  { code: "EE", name: "Electrical & Electronics Engineering" },
  { code: "CI", name: "Electronics & Computer Engineering" },
  { code: "EC", name: "Electronics and Communication Engineering" },
  { code: "IS", name: "Information Science and Engineering" },
  { code: "ME", name: "Mechanical Engineering" },
];

function calculateCurrentYear(yearEnrolled?: string): number {
  if (!yearEnrolled) return 1;
  const enrolled = parseInt(yearEnrolled, 10);
  const now = new Date();
  const currentYear = now.getFullYear();
  const hasPassed = now.getMonth() >= 8;
  const year = currentYear - enrolled + 1 + (hasPassed ? 1 : 0);
  return Math.min(year, 4);
}

const AVATAR_COLORS = [
  "#7c5cff",
  "#22d3ee",
  "#f472b6",
  "#34d399",
  "#fb923c",
  "#facc15",
  "#a78bfa",
  "#f87171",
  "#38bdf8",
  "#4ade80",
  "#e879f9",
  "#fbbf24",
];

const BANNER_PRESETS: { label: string; from: string; to: string }[] = [
  { label: "Purple Night", from: "#1a1040", to: "#7c5cff" },
  { label: "Ocean", from: "#0c1a2e", to: "#22d3ee" },
  { label: "Rose", from: "#1a0a12", to: "#f472b6" },
  { label: "Forest", from: "#0a1a10", to: "#34d399" },
  { label: "Ember", from: "#1a0f00", to: "#fb923c" },
  { label: "Gold", from: "#1a1500", to: "#facc15" },
  { label: "Violet", from: "#110a1a", to: "#a78bfa" },
  { label: "Crimson", from: "#1a0808", to: "#f87171" },
  { label: "Sky", from: "#040f1a", to: "#38bdf8" },
  { label: "Mint", from: "#061a0f", to: "#4ade80" },
  { label: "Fuchsia", from: "#1a051a", to: "#e879f9" },
  { label: "Amber", from: "#180e00", to: "#fbbf24" },
];

function getBannerGradient(color: string) {
  const preset = BANNER_PRESETS.find((p) => p.from === color || p.to === color);
  if (preset) {
    return `linear-gradient(135deg, ${preset.from}, ${preset.to})`;
  }
  return `linear-gradient(135deg, ${color}, #0c0c14)`;
}

type ColorSwatchProps = {
  color: string;
  selected: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
};

function ColorSwatch({ color, selected, onClick, style }: ColorSwatchProps) {
  return (
    <button
      onClick={onClick}
      className="relative w-8 h-8 rounded-full ring-2 ring-offset-2 ring-offset-card transition-all hover:scale-110"
      style={{
        background: color,
        ringColor: selected ? color : "transparent",
        ...style,
      }}
      title={color}
    >
      {selected && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Check className="w-3.5 h-3.5 text-white drop-shadow" />
        </span>
      )}
    </button>
  );
}

export default function ProfilePage() {
  const qc = useQueryClient();
  const { data: profile } = useGetMyProfile();
  const { data: interests = [] } = useListInterests();
  const { data: myPosts = [] } = useGetUserPosts(profile?.username ?? "");
  const update = useUpdateMyProfile();

  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [interestIds, setInterestIds] = useState<number[]>([]);
  const [avatarColor, setAvatarColor] = useState("#7c5cff");
  const [bannerColor, setBannerColor] = useState("#1a1040");
  const [mobileNumber, setMobileNumber] = useState("");
  const [usn, setUsn] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [branch, setBranch] = useState("");
  const [yearEnrolled, setYearEnrolled] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showBannerPicker, setShowBannerPicker] = useState(false);

  // Username edit state
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameCountdown, setUsernameCountdown] = useState(5);
  const [usernameSaving, setUsernameSaving] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!profile) return;
    setBio(profile.bio ?? "");
    setSkills(profile.skills);
    setInterestIds(profile.interests.map((i) => i.id));
    setAvatarColor(profile.avatarColor);
    setBannerColor(profile.bannerColor ?? "#1a1040");
    setMobileNumber(profile.mobileNumber ?? "");
    setUsn(profile.usn ?? "");
    setPortfolioUrl(profile.portfolioUrl ?? "");
    setLinkedinUrl(profile.linkedinUrl ?? "");
    setGithubUrl(profile.githubUrl ?? "");
    setBranch(profile.branch ?? "");
    setYearEnrolled(profile.yearEnrolled ?? "");
  }, [profile]);

  const grouped = useMemo(() => {
    const out = new Map<string, typeof interests>();
    for (const i of interests) {
      const arr = out.get(i.category) ?? [];
      arr.push(i);
      out.set(i.category, arr);
    }
    return Array.from(out.entries());
  }, [interests]);

  function openUsernameModal() {
    setNewUsername(profile?.username ?? "");
    setUsernameError("");
    setUsernameCountdown(5);
    setShowUsernameModal(true);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setUsernameCountdown((n) => {
        if (n <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
  }

  function closeUsernameModal() {
    setShowUsernameModal(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }

  async function saveUsername() {
    const trimmed = newUsername.trim();
    if (!trimmed || trimmed === profile?.username) { closeUsernameModal(); return; }
    if (trimmed.length < 3 || trimmed.length > 24) {
      setUsernameError("Username must be 3–24 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setUsernameError("Only letters, numbers, and underscores allowed.");
      return;
    }
    setUsernameSaving(true);
    setUsernameError("");
    try {
      await update.mutateAsync({ data: { username: trimmed } });
      qc.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
      qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      closeUsernameModal();
      setSavedAt(new Date());
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; message?: string; daysLeft?: number } } };
      const data = e?.response?.data;
      if (data?.error === "username_taken") setUsernameError("That username is already taken. Try another.");
      else if (data?.error === "username_cooldown") setUsernameError(data.message ?? "You can't change your username yet.");
      else setUsernameError("Something went wrong. Please try again.");
    } finally {
      setUsernameSaving(false);
    }
  }

  function addSkill() {
    const s = skillInput.trim();
    if (!s || skills.includes(s)) return;
    setSkills([...skills, s]);
    setSkillInput("");
  }

  async function save() {
    await update.mutateAsync({
      data: {
        bio: bio.trim(),
        skills,
        interestIds,
        avatarColor,
        bannerColor,
        mobileNumber: mobileNumber.trim() || undefined,
        usn: usn.trim() || undefined,
        branch: branch || undefined,
        yearEnrolled: yearEnrolled || undefined,
        portfolioUrl: portfolioUrl.trim() || undefined,
        linkedinUrl: linkedinUrl.trim() || undefined,
        githubUrl: githubUrl.trim() || undefined,
      },
    });
    qc.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
    qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    setSavedAt(new Date());
    setShowAvatarPicker(false);
    setShowBannerPicker(false);
  }

  if (!profile) {
    return <div className="p-8 text-muted-foreground">Loading…</div>;
  }

  const bannerGradient = getBannerGradient(bannerColor);

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <Card className="bg-card border-card-border overflow-hidden">
        {/* Banner */}
        <div className="relative h-28" style={{ background: bannerGradient }}>
          <button
            onClick={() => {
              setShowBannerPicker(!showBannerPicker);
              setShowAvatarPicker(false);
            }}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-black/40 hover:bg-black/60 text-white text-xs font-medium backdrop-blur-sm transition-colors"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Edit banner
          </button>

          {showBannerPicker && (
            <div className="absolute top-10 right-3 z-20 bg-popover border border-border rounded-xl shadow-2xl p-4 w-72">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold">Choose banner theme</span>
                <button onClick={() => setShowBannerPicker(false)}>
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {BANNER_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setBannerColor(p.from)}
                    className={`relative h-10 rounded-md ring-2 ring-offset-1 ring-offset-popover transition-all hover:scale-105 overflow-hidden ${
                      bannerColor === p.from
                        ? "ring-primary"
                        : "ring-transparent"
                    }`}
                    title={p.label}
                    style={{
                      background: `linear-gradient(135deg, ${p.from}, ${p.to})`,
                    }}
                  >
                    {bannerColor === p.from && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white drop-shadow" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-3">
                Changes are saved with the "Save changes" button.
              </p>
            </div>
          )}
        </div>

        <CardContent className="-mt-14 pb-6">
          {/* Row 1: avatar (left) + stats (right) */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            {/* Avatar with edit overlay */}
            <div className="relative">
              <Avatar className="w-24 h-24 ring-4 ring-card">
                <AvatarFallback
                  style={{ backgroundColor: avatarColor }}
                  className="text-white text-3xl font-bold"
                >
                  {(profile.username?.[0] || profile.name?.[0] || "?").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => {
                  setShowAvatarPicker(!showAvatarPicker);
                  setShowBannerPicker(false);
                }}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center shadow-lg transition-colors ring-2 ring-card"
                title="Edit profile picture color"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>

              {showAvatarPicker && (
                <div className="absolute left-0 top-full mt-2 z-20 bg-popover border border-border rounded-xl shadow-2xl p-4 w-64">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold">Choose avatar color</span>
                    <button onClick={() => setShowAvatarPicker(false)}>
                      <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {AVATAR_COLORS.map((c) => (
                      <ColorSwatch
                        key={c}
                        color={c}
                        selected={avatarColor === c}
                        onClick={() => setAvatarColor(c)}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-3">
                    Changes are saved with the "Save changes" button.
                  </p>
                </div>
              )}
            </div>

            {/* Stats — push down to sit below the banner */}
            <div className="flex gap-3 text-sm mt-16">
              <Stat icon={<Coins className="w-4 h-4 text-yellow-400" />} label="Coins" value={profile.coins} />
              <Stat icon={<Users className="w-4 h-4 text-emerald-400" />} label="Communities" value={profile.communityCount} />
              <Stat icon={<UserCheck className="w-4 h-4 text-violet-400" />} label="Followers" value={profile.followerCount} />
            </div>
          </div>

          {/* Row 2: username + links — always below the banner */}
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {profile.username ? `@${profile.username}` : profile.name || "Student"}
              </div>
              <button
                onClick={openUsernameModal}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary hover:bg-accent/40 border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
                title="Edit username"
              >
                <Pencil className="w-3 h-3" /> Edit
              </button>
            </div>
            {profile.usernameChangedAt && (
              <div className="flex items-center gap-1 mt-0.5 text-[11px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                {(() => {
                  const daysSince = (Date.now() - new Date(profile.usernameChangedAt).getTime()) / (1000 * 60 * 60 * 24);
                  const daysLeft = Math.ceil(100 - daysSince);
                  return daysLeft > 0
                    ? `Username can be changed again in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`
                    : "Username is now changeable";
                })()}
              </div>
            )}
            <div className="text-sm text-muted-foreground mt-0.5">{profile.email}</div>
            {/* Social links */}
            <div className="flex flex-wrap gap-2 mt-3">
              {profile.portfolioUrl ? (
                <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium transition-colors">
                  <Globe className="w-3.5 h-3.5" />Portfolio<ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-secondary text-muted-foreground text-xs font-medium">
                  <Globe className="w-3.5 h-3.5" />Portfolio
                </span>
              )}
              {profile.linkedinUrl ? (
                <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-sky-500/40 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 text-xs font-medium transition-colors">
                  <Linkedin className="w-3.5 h-3.5" />LinkedIn<ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-secondary text-muted-foreground text-xs font-medium">
                  <Linkedin className="w-3.5 h-3.5" />LinkedIn
                </span>
              )}
              {profile.githubUrl ? (
                <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs font-medium transition-colors">
                  <Github className="w-3.5 h-3.5" />GitHub<ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-secondary text-muted-foreground text-xs font-medium">
                  <Github className="w-3.5 h-3.5" />GitHub
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-card-border">
        <CardHeader>
          <CardTitle className="text-base">About you</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="+91 98765 43210"
                maxLength={15}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usn">USN (University Seat No.)</Label>
              <Input
                id="usn"
                value={usn}
                onChange={(e) => setUsn(e.target.value)}
                placeholder="1XX21XX000"
                maxLength={12}
                className="font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <select
                id="branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              >
                <option value="">Select your branch</option>
                {BRANCHES.map((b) => (
                  <option key={b.code} value={b.code}>[{b.code}] {b.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearEnrolled">Year Enrolled</Label>
              <select
                id="yearEnrolled"
                value={yearEnrolled}
                onChange={(e) => setYearEnrolled(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              >
                <option value="">Select enrollment year</option>
                {Array.from({ length: 20 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year.toString()}>
                      {year}
                    </option>
                  );
                })}
              </select>
              {yearEnrolled && (
                <p className="text-xs text-muted-foreground mt-1">
                  Current year: <span className="font-semibold">{calculateCurrentYear(yearEnrolled)}</span>
                  {calculateCurrentYear(yearEnrolled) === 4 && " (Final Year)"}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="portfolio">Portfolio URL</Label>
              <Input
                id="portfolio"
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://yourportfolio.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input
                id="linkedin"
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github">GitHub URL</Label>
              <Input
                id="github"
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/yourusername"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="A line about you, your major, what you're building…"
              data-testid="input-profile-bio"
            />
          </div>

          <div className="space-y-2">
            <Label>Skills</Label>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Add a skill"
                data-testid="input-profile-skill"
              />
              <Button type="button" variant="secondary" onClick={addSkill}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {skills.map((s) => (
                <span
                  key={s}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary border border-border text-sm"
                >
                  {s}
                  <button
                    onClick={() => setSkills(skills.filter((x) => x !== s))}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {skills.length === 0 && (
                <span className="text-xs text-muted-foreground">
                  No skills yet — add a few.
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-card-border">
        <CardHeader>
          <CardTitle className="text-base">Your interests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {grouped.map(([category, items]) => (
            <div key={category}>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                {category}
              </div>
              <div className="flex flex-wrap gap-2">
                {items.map((i) => {
                  const selected = interestIds.includes(i.id);
                  return (
                    <button
                      key={i.id}
                      onClick={() =>
                        setInterestIds((prev) =>
                          prev.includes(i.id)
                            ? prev.filter((x) => x !== i.id)
                            : [...prev, i.id],
                        )
                      }
                      className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                        selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary border-border hover:bg-accent/30"
                      }`}
                      data-testid={`chip-profile-interest-${i.id}`}
                    >
                      {i.emoji ? `${i.emoji} ` : ""}
                      {i.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {myPosts.length > 0 && (
        <Card className="bg-card border-card-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Your posts · {myPosts.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {myPosts.map((p) => (
              <PostCard key={p.id} post={p} currentUsername={profile?.username} />
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-end gap-3 sticky bottom-4">
        {savedAt && (
          <span className="text-xs text-muted-foreground">
            Saved {savedAt.toLocaleTimeString()}
          </span>
        )}
        <Button onClick={save} disabled={update.isPending} data-testid="button-save-profile">
          {update.isPending ? "Saving…" : (
            <>
              <Save className="w-4 h-4 mr-2" /> Save changes
            </>
          )}
        </Button>
      </div>

      {/* Username Change Modal */}
      {showUsernameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold">Change username</h2>
                  <p className="text-xs text-muted-foreground">Read the warning before continuing</p>
                </div>
              </div>
              <button onClick={closeUsernameModal} className="text-muted-foreground hover:text-foreground mt-0.5">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning box */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
              <p className="text-sm font-semibold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Before you change your username
              </p>
              <ul className="text-xs text-amber-200/80 space-y-1.5 list-disc list-inside">
                <li>Your old username <strong>@{profile.username}</strong> will be released immediately and can be claimed by anyone.</li>
                <li>Any links or mentions using your old username will stop working.</li>
                <li>You can only change your username <strong>once every 100 days</strong>.</li>
                <li>Your posts and community memberships stay intact.</li>
              </ul>
            </div>

            {/* New username input */}
            <div className="space-y-2">
              <Label htmlFor="new-username" className="text-sm">New username</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <Input
                  id="new-username"
                  value={newUsername}
                  onChange={(e) => { setNewUsername(e.target.value); setUsernameError(""); }}
                  className="pl-7"
                  placeholder="yourhandle"
                  maxLength={24}
                  autoComplete="off"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-muted-foreground">3–24 characters. Letters, numbers, and underscores only.</p>
              {usernameError && (
                <p className="text-xs text-destructive font-medium">{usernameError}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button variant="ghost" className="flex-1" onClick={closeUsernameModal}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={usernameCountdown > 0 || usernameSaving || !newUsername.trim() || newUsername.trim() === profile.username}
                onClick={saveUsername}
              >
                {usernameSaving
                  ? "Saving…"
                  : usernameCountdown > 0
                  ? `Continue (${usernameCountdown}s)`
                  : "Continue"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary border border-border">
      {icon}
      <div className="flex flex-col leading-tight">
        <span className="font-semibold text-sm">{value}</span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}
