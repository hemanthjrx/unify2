import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { Sparkles, Users, Coins, Compass, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppAuth } from "@/lib/auth";

const features = [
  {
    icon: Compass,
    title: "Discover your tribe",
    body: "Find students who share your interests, skills, and goals.",
  },
  {
    icon: Users,
    title: "Join real communities",
    body: "Hackathons, study groups, design crits — pick your scenes.",
  },
  {
    icon: Coins,
    title: "Earn while you learn",
    body: "Stack coins for joining, sharing, and helping classmates.",
  },
];

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function SignInPage() {
  const [usn, setUsn] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAppAuth();
  const [, navigate] = useLocation();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!usn.trim() || !password) {
      setError("Please enter your USN and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${window.location.origin}${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usn: usn.trim().toUpperCase(), password }),
      });
      const data = await res.json() as { token?: string; user?: { id: number; name: string | null; email: string | null; usn: string | null }; message?: string };
      if (!res.ok) {
        setError(data.message ?? "Invalid USN or password.");
        return;
      }
      login(data.token!, data.user!);
      navigate("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 bg-gradient-to-br from-[#1a0f3d] via-[#0c0c14] to-[#0a1f2e] relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight">Unify</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Student networking
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-8 max-w-md">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold leading-tight">
              Where students <span className="text-primary">connect</span>,
              build, and level up together.
            </h1>
            <p className="text-muted-foreground">
              Match with collaborators, join interest communities, and earn
              coins for showing up.
            </p>
          </div>

          <div className="space-y-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-card/40 backdrop-blur"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-sm">{f.title}</div>
                  <div className="text-xs text-muted-foreground">{f.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-muted-foreground">
          Built for the next generation of students.
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold">Unify</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold">Sign in to Unify</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome back! Enter your USN and password to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="usn">University Seat Number (USN)</Label>
              <Input
                id="usn"
                value={usn}
                onChange={(e) => setUsn(e.target.value.toUpperCase())}
                placeholder="1XX21CS000"
                className="font-mono"
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <a
              href={`${BASE}/sign-up`}
              className="text-primary hover:underline font-medium"
            >
              Create account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
