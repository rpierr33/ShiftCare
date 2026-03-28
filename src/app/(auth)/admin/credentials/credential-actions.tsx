"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { approveCredential, rejectCredential } from "@/actions/credentials";

export function CredentialActions({ workerId }: { workerId: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "approve" | "reject">("idle");
  const [expiryDate, setExpiryDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleApprove() {
    if (!expiryDate) {
      setError("Expiry date is required.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await approveCredential(workerId, expiryDate);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error || "Failed to approve.");
      setLoading(false);
    }
  }

  async function handleReject() {
    if (!reason.trim()) {
      setError("Reason is required.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await rejectCredential(workerId, reason);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error || "Failed to reject.");
      setLoading(false);
    }
  }

  if (mode === "approve") {
    return (
      <div className="space-y-2">
        <Input
          type="date"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
          className="rounded-lg text-xs h-8"
          placeholder="Expiry date"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-1">
          <Button
            onClick={handleApprove}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-2 rounded-lg"
          >
            {loading ? "..." : "Confirm"}
          </Button>
          <Button
            onClick={() => { setMode("idle"); setError(""); }}
            variant="outline"
            className="text-xs h-7 px-2 rounded-lg"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (mode === "reject") {
    return (
      <div className="space-y-2">
        <Input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="rounded-lg text-xs h-8"
          placeholder="Rejection reason"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-1">
          <Button
            onClick={handleReject}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white text-xs h-7 px-2 rounded-lg"
          >
            {loading ? "..." : "Reject"}
          </Button>
          <Button
            onClick={() => { setMode("idle"); setError(""); }}
            variant="outline"
            className="text-xs h-7 px-2 rounded-lg"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      <button
        onClick={() => setMode("approve")}
        className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors"
      >
        <Check size={14} />
        Approve
      </button>
      <button
        onClick={() => setMode("reject")}
        className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors"
      >
        <X size={14} />
        Reject
      </button>
    </div>
  );
}
