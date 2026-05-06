import { useState, useRef, type FormEvent } from "react";
import { useLocation } from "wouter";
import { Sparkles, Eye, EyeOff, Upload, X, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

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

const SEMESTERS = [
  { value: "1", label: "1st Semester" },
  { value: "2", label: "2nd Semester" },
  { value: "3", label: "3rd Semester" },
  { value: "4", label: "4th Semester" },
  { value: "5", label: "5th Semester" },
  { value: "6", label: "6th Semester" },
  { value: "7", label: "7th Semester" },
  { value: "8", label: "8th Semester" },
];

async function uploadDocument(file: File): Promise<string> {
  const urlRes = await fetch(`${window.location.origin}${BASE}/api/storage/uploads/request-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
  });
  if (!urlRes.ok) throw new Error("Failed to get upload URL");
  const { uploadURL, objectPath } = await urlRes.json() as { uploadURL: string; objectPath: string };
  const putRes = await fetch(uploadURL, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!putRes.ok) throw new Error("Upload failed");
  return objectPath as string;
}

function DocumentUploader({
  label,
  hint,
  value,
  onUpload,
  required,
}: {
  label: string;
  hint: string;
  value: { name: string; objectPath: string } | null;
  onUpload: (v: { name: string; objectPath: string } | null) => void;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleFile(file: File) {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setErr("Invalid format. Please upload a JPG, PNG, WEBP, or PDF file.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setErr("File is too large. Maximum size is 3 MB.");
      return;
    }
    setErr(null);
    setUploading(true);
    try {
      const objectPath = await uploadDocument(file);
      onUpload({ name: file.name, objectPath });
    } catch {
      setErr("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <p className="text-xs text-muted-foreground">{hint}</p>
      {value ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10">
          <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="text-sm text-emerald-300 truncate flex-1">{value.name}</span>
          <button
            type="button"
            onClick={() => { onUpload(null); if (inputRef.current) inputRef.current.value = ""; }}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center gap-2 px-3 py-3 rounded-lg border border-dashed border-border hover:border-primary/60 bg-secondary/30 hover:bg-secondary/50 transition-colors text-sm text-muted-foreground disabled:opacity-60"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Click to upload (PDF, JPG, PNG · max 3 MB)
            </>
          )}
        </button>
      )}
      {err && <p className="text-xs text-destructive">{err}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}

function UsnConflictModal({
  usn,
  conflictUsername,
  reporterName,
  reporterEmail,
  onClose,
}: {
  usn: string;
  conflictUsername: string | null;
  reporterName: string;
  reporterEmail: string;
  onClose: () => void;
}) {
  const [showReport, setShowReport] = useState(false);
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submitReport() {
    if (!description.trim()) return;
    setLoading(true);
    try {
      await fetch(`${window.location.origin}${BASE}/api/auth/usn-conflict-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimedUsn: usn,
          description: description.trim(),
          reporterName,
          reporterEmail,
        }),
      });
      setSubmitted(true);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        {submitted ? (
          <div className="text-center space-y-3 py-2">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
            <div className="font-semibold">Report submitted</div>
            <p className="text-sm text-muted-foreground">
              An admin will review your report. Thank you for letting us know.
            </p>
            <Button className="w-full" onClick={onClose}>Close</Button>
          </div>
        ) : showReport ? (
          <>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-bold text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" /> Report USN Conflict
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Describe why you believe this USN belongs to you
                </div>
              </div>
              <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <Textarea
              placeholder="e.g. This is my USN. Someone else may have registered using my details without my knowledge. My student ID number is..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={1000}
            />
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => setShowReport(false)}>
                Back
              </Button>
              <Button
                size="sm"
                className="flex-1"
                disabled={!description.trim() || loading}
                onClick={submitReport}
              >
                {loading ? "Submitting…" : "Submit Report"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <div className="font-bold text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" /> USN Already Registered
              </div>
              <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <p className="text-sm text-muted-foreground">
              The USN <span className="font-mono text-foreground font-semibold">{usn}</span> is already
              registered{conflictUsername ? <> to account <span className="text-primary font-semibold">@{conflictUsername}</span></> : ""}.
            </p>
            <p className="text-sm text-muted-foreground">
              If this is your USN and you didn't create this account, please report it.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>
                Go back
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={() => setShowReport(true)}
              >
                Not you? Report
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SignUpPage() {
  const [form, setForm] = useState({
    name: "",
    usn: "",
    email: "",
    mobileNumber: "",
    dob: "",
    semester: "",
    branch: "",
    password: "",
    confirmPassword: "",
  });
  const [idCard, setIdCard] = useState<{ name: string; objectPath: string } | null>(null);
  const [feeReceipt, setFeeReceipt] = useState<{ name: string; objectPath: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [usnConflict, setUsnConflict] = useState<{ usn: string; username: string | null } | null>(null);
  const [, navigate] = useLocation();

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "usn" && usnConflict) setUsnConflict(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const { name, usn, email, mobileNumber, dob, semester, branch, password, confirmPassword } = form;

    if (!name.trim() || !usn.trim() || !email.trim() || !mobileNumber.trim() || !dob || !semester || !branch || !password) {
      setError("All fields are required.");
      return;
    }
    if (!idCard) {
      setError("Please upload your college ID card.");
      return;
    }
    if (!feeReceipt) {
      setError("Please upload your fee receipt.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${window.location.origin}${BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          usn: usn.trim().toUpperCase(),
          email: email.trim().toLowerCase(),
          mobileNumber: mobileNumber.trim(),
          dob,
          semester,
          branch,
          password,
          idCardUrl: idCard.objectPath,
          feeReceiptUrl: feeReceipt.objectPath,
        }),
      });
      const data = await res.json() as {
        ok?: boolean;
        error?: string;
        message?: string;
        username?: string;
      };
      if (!res.ok) {
        if (data.error === "usn_taken") {
          setUsnConflict({ usn: usn.trim().toUpperCase(), username: data.username ?? null });
        } else {
          setError(data.message ?? "Registration failed. Please try again.");
        }
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const selectClass = "w-full px-3 py-2 rounded-lg border border-border bg-[#16161f] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors";

  if (submitted) {
    return (
      <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold">Application Submitted!</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your account application is now <strong className="text-yellow-400">pending review</strong> by a moderator.
            You will be able to sign in once your application has been approved.
          </p>
          <div className="bg-secondary/50 rounded-xl p-4 text-sm text-left space-y-2 border border-border">
            <div className="font-semibold text-foreground">What happens next?</div>
            <ul className="space-y-1 text-muted-foreground text-xs list-disc list-inside">
              <li>A moderator will verify your ID card and fee receipt</li>
              <li>Approval usually takes 1–2 business days</li>
              <li>Once approved, you can sign in with your USN and password</li>
            </ul>
          </div>
          <Button className="w-full" onClick={() => navigate("/sign-in")}>
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center p-6">
      {usnConflict && (
        <UsnConflictModal
          usn={usnConflict.usn}
          conflictUsername={usnConflict.username}
          reporterName={form.name}
          reporterEmail={form.email}
          onClose={() => setUsnConflict(null)}
        />
      )}

      <div className="w-full max-w-lg">
        <div className="mb-8 flex items-center gap-3 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold">Unify</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Join thousands of students on Unify.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Rahul Sharma"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="usn">USN <span className="text-destructive">*</span></Label>
                <Input
                  id="usn"
                  value={form.usn}
                  onChange={(e) => set("usn", e.target.value.toUpperCase())}
                  placeholder="1XX21CS000"
                  className="font-mono"
                  maxLength={12}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="you@college.edu"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mobile">Mobile Number <span className="text-destructive">*</span></Label>
              <Input
                id="mobile"
                type="tel"
                value={form.mobileNumber}
                onChange={(e) => set("mobileNumber", e.target.value)}
                placeholder="+91 98765 43210"
                maxLength={15}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dob">Date of Birth <span className="text-destructive">*</span></Label>
              <Input
                id="dob"
                type="date"
                value={form.dob}
                onChange={(e) => set("dob", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="semester">Semester <span className="text-destructive">*</span></Label>
                <select
                  id="semester"
                  value={form.semester}
                  onChange={(e) => set("semester", e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select semester</option>
                  {SEMESTERS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="branch">Branch <span className="text-destructive">*</span></Label>
                <select
                  id="branch"
                  value={form.branch}
                  onChange={(e) => set("branch", e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select branch</option>
                  {BRANCHES.map((b) => (
                    <option key={b.code} value={b.code}>[{b.code}] {b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="At least 8 characters"
                  className="pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm Password <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => set("confirmPassword", e.target.value)}
                  placeholder="Repeat your password"
                  className="pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-border space-y-4">
              <div>
                <p className="text-sm font-semibold mb-1">Proof of Admission</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Both documents are required to verify your enrollment before your account is approved.
                </p>
                <div className="space-y-3">
                  <DocumentUploader
                    label="College ID Card"
                    hint="Upload a clear photo or scan of your current college ID card"
                    value={idCard}
                    onUpload={setIdCard}
                    required
                  />
                  <DocumentUploader
                    label="Fee Receipt"
                    hint="Upload your latest fee payment receipt or challan"
                    value={feeReceipt}
                    onUpload={setFeeReceipt}
                    required
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? "Submitting application…" : "Submit Application"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Already have an account?{" "}
            <a
              href={`${BASE}/sign-in`}
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
