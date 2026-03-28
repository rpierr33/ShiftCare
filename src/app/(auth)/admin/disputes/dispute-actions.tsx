"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DisputeActions({
  shiftId,
  workerId,
  grossAmount,
  workerPayout,
}: {
  shiftId: string;
  workerId: string;
  grossAmount: number;
  workerPayout: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function handleResolve(action: "release" | "refund") {
    setLoading(action);
    setMessage("");
    try {
      const res = await fetch("/api/admin/resolve-dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shiftId, workerId, action }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(action === "release" ? "Payment released to worker." : "Payment refunded to employer.");
        router.refresh();
      } else {
        setMessage(data.error || "Failed to resolve dispute.");
      }
    } catch {
      setMessage("An error occurred.");
    }
    setLoading(null);
  }

  return (
    <div>
      {message && (
        <p className={`text-sm mb-3 ${message.includes("Failed") || message.includes("error") ? "text-red-600" : "text-emerald-600"}`}>
          {message}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleResolve("release")}
          disabled={!!loading}
          className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          {loading === "release" ? "Releasing..." : `Release $${workerPayout.toFixed(2)} to Worker`}
        </button>
        <button
          onClick={() => handleResolve("refund")}
          disabled={!!loading}
          className="px-4 py-2 bg-slate-600 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          {loading === "refund" ? "Refunding..." : `Refund $${grossAmount.toFixed(2)} to Employer`}
        </button>
      </div>
    </div>
  );
}
