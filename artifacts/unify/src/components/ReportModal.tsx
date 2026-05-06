import { useState } from "react";
import { Flag, X, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuthenticatedFetch } from "@/lib/api-fetch";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export type ReportTargetType = "post" | "marketplace" | "freelance" | "hackathon";

interface ReportModalProps {
  targetType: ReportTargetType;
  targetId: number;
  label?: string;
  onClose: () => void;
}

export function ReportModal({ targetType, targetId, label, onClose }: ReportModalProps) {
  const afetch = useAuthenticatedFetch();
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit() {
    if (!description.trim() || loading) return;
    setLoading(true);
    try {
      await afetch(`${BASE}/api/admin/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, description: description.trim() }),
      });
      setSubmitted(true);
    } catch {
      /* silently fail */
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
              Thank you. An admin will review this report.
            </p>
            <Button className="w-full" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-bold text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  Report {label ?? targetType}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Describe the issue so admins can review it
                </div>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <Textarea
              placeholder="Describe the problem — e.g. spam, harassment, inappropriate content, scam..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={1000}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{description.length}/1000</p>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1"
                disabled={description.trim().length < 5 || loading}
                onClick={submit}
              >
                {loading ? "Submitting…" : "Submit Report"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function ReportButton({
  targetType,
  targetId,
  label,
  className = "",
}: {
  targetType: ReportTargetType;
  targetId: number;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        title="Report"
        className={`flex items-center gap-1 text-xs text-muted-foreground hover:text-yellow-400 transition-colors ${className}`}
      >
        <Flag className="w-3.5 h-3.5" />
        <span>Report</span>
      </button>
      {open && (
        <ReportModal
          targetType={targetType}
          targetId={targetId}
          label={label}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
