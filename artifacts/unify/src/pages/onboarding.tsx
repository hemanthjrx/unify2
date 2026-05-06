import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  useListInterests,
  useGetMyProfile,
  useCompleteOnboarding,
  getGetMyProfileQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowRight, Check, X } from "lucide-react";

export default function OnboardingPage() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data: interests = [] } = useListInterests();
  const { data: profile } = useGetMyProfile();
  const complete = useCompleteOnboarding();
  const qc = useQueryClient();

  const grouped = useMemo(() => {
    const out = new Map<string, typeof interests>();
    for (const i of interests) {
      const arr = out.get(i.category) ?? [];
      arr.push(i);
      out.set(i.category, arr);
    }
    return Array.from(out.entries());
  }, [interests]);

  const usernameOk = /^[a-zA-Z0-9_]{3,24}$/.test(username);
  const interestsOk = selectedInterests.length >= 3;

  function toggleInterest(id: number) {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function addSkill() {
    const s = skillInput.trim();
    if (!s) return;
    if (skills.includes(s)) return;
    setSkills([...skills, s]);
    setSkillInput("");
  }

  async function submit() {
    setError(null);
    try {
      const updatedProfile = await complete.mutateAsync({
        data: {
          username,
          bio: bio.trim() || undefined,
          skills,
          interestIds: selectedInterests,
        },
      });
      qc.setQueryData(getGetMyProfileQueryKey(), updatedProfile);
      navigate("/dashboard");
    } catch (e) {
      const msg =
        e instanceof Error && e.message.includes("409")
          ? "That username is already taken."
          : "Something went wrong. Try again.";
      setError(msg);
    }
  }

  if (profile?.onboardingComplete) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <header className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xl font-bold">Welcome to Unify</div>
            <div className="text-sm text-muted-foreground">
              Let’s set up your profile so we can match you with peers.
            </div>
          </div>
        </header>

        <div className="flex items-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-secondary"
              }`}
            />
          ))}
        </div>

        {step === 0 && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Pick a username</h2>
              <p className="text-muted-foreground text-sm mt-1">
                3–24 characters, letters / numbers / underscores. This is how
                others will find you.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  @
                </span>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))}
                  placeholder="alex_codes"
                  className="pl-7"
                  data-testid="input-username"
                  maxLength={24}
                />
              </div>
              {username && !usernameOk && (
                <p className="text-xs text-destructive">
                  Use 3–24 letters, numbers, or underscores.
                </p>
              )}
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => setStep(1)}
                disabled={!usernameOk}
                data-testid="button-onboarding-next-1"
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">What are you into?</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Pick at least 3. We use these to find your people.
              </p>
            </div>
            <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-2">
              {grouped.map(([category, items]) => (
                <div key={category}>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                    {category}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {items.map((i) => {
                      const selected = selectedInterests.includes(i.id);
                      return (
                        <button
                          key={i.id}
                          onClick={() => toggleInterest(i.id)}
                          className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                            selected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-secondary border-border hover:bg-accent/30"
                          }`}
                          data-testid={`chip-interest-${i.id}`}
                        >
                          {i.emoji ? `${i.emoji} ` : ""}
                          {i.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {selectedInterests.length} selected
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!interestsOk}
                  data-testid="button-onboarding-next-2"
                >
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Tell us a bit about you</h2>
              <p className="text-muted-foreground text-sm mt-1">
                A short bio and your top skills (optional, but nice).
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="CS junior building a study app. Loves indie games."
                rows={3}
                data-testid="input-bio"
                maxLength={200}
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
                  placeholder="React, Figma, Python…"
                  data-testid="input-skill"
                />
                <Button type="button" variant="secondary" onClick={addSkill}>
                  Add
                </Button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-sm border border-border"
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
                </div>
              )}
            </div>
            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={submit}
                disabled={complete.isPending}
                data-testid="button-onboarding-finish"
              >
                {complete.isPending ? "Saving…" : "Finish"}{" "}
                <Check className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
