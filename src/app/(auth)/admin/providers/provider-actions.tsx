"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, AlertTriangle, Ban } from "lucide-react";
import {
  verifyProvider,
  blockProvider,
  sendProviderWarning,
} from "@/actions/admin";

interface ProviderActionsProps {
  providerId: string;
  userId: string;
  isVerified: boolean;
  isBlocked: boolean;
  daysSinceSignup: number;
}

export function ProviderActions({
  providerId,
  userId,
  isVerified,
  isBlocked,
  daysSinceSignup,
}: ProviderActionsProps) {
  const router = useRouter();
  const [mode, setMode] = useState<
    "idle" | "block" | "warning"
  >("idle");
  const [reason, setReason] = useState("");
  const [warningMessage, setWarningMessage] = useState(
    daysSinceSignup > 30
      ? `Your account verification is overdue (${daysSinceSignup} days). Please complete verification to continue posting shifts.`
      : "Please complete your account verification to continue using ShiftCare."
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleVerify() {
    setLoading("verify");
    setError("");
    const result = await verifyProvider(providerId);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error || "Failed to verify.");
    }
    setLoading(null);
  }

  async function handleBlock() {
    if (!reason.trim()) {
      setError("Block reason is required.");
      return;
    }
    setLoading("block");
    setError("");
    const result = await blockProvider(providerId, reason);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error || "Failed to block.");
    }
    setLoading(null);
  }

  async function handleSendWarning() {
    if (!warningMessage.trim()) {
      setError("Warning message is required.");
      return;
    }
    setLoading("warning");
    setError("");
    const result = await sendProviderWarning(providerId, warningMessage);
    if (result.success) {
      setMode("idle");
      setError("");
    } else {
      setError(result.error || "Failed to send warning.");
    }
    setLoading(null);
  }

  if (isBlocked) {
    return (
      <div className="text-xs text-slate-400 italic">Account blocked</div>
    );
  }

  if (mode === "block") {
    return (
      <div className="space-y-2 max-w-xs">
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-lg border border-slate-200 text-xs h-8 px-2.5 focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="Reason for blocking..."
          autoFocus
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-1">
          <button
            onClick={handleBlock}
            disabled={loading === "block"}
            className="flex items-center gap-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading === "block" ? "..." : "Confirm Block"}
          </button>
          <button
            onClick={() => {
              setMode("idle");
              setError("");
              setReason("");
            }}
            className="text-xs text-slate-500 hover:text-slate-700 px-2.5 py-1.5"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (mode === "warning") {
    return (
      <div className="space-y-2 max-w-sm">
        <textarea
          value={warningMessage}
          onChange={(e) => setWarningMessage(e.target.value)}
          className="w-full rounded-lg border border-slate-200 text-xs h-16 px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
          placeholder="Warning message..."
          autoFocus
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-1">
          <button
            onClick={handleSendWarning}
            disabled={loading === "warning"}
            className="flex items-center gap-1 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading === "warning" ? "..." : "Send Warning"}
          </button>
          <button
            onClick={() => {
              setMode("idle");
              setError("");
            }}
            className="text-xs text-slate-500 hover:text-slate-700 px-2.5 py-1.5"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && <p className="text-xs text-red-500 mb-1">{error}</p>}
      <div className="flex gap-1.5 flex-wrap">
        {!isVerified && (
          <button
            onClick={handleVerify}
            disabled={!!loading}
            className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <Check size={14} />
            {loading === "verify" ? "..." : "Mark Verified"}
          </button>
        )}
        <button
          onClick={() => setMode("warning")}
          disabled={!!loading}
          className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          <AlertTriangle size={14} />
          Send Warning
        </button>
        <button
          onClick={() => setMode("block")}
          disabled={!!loading}
          className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          <Ban size={14} />
          Block
        </button>
      </div>
    </div>
  );
}
