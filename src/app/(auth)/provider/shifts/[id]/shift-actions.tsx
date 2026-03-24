"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelShift, completeShift } from "@/actions/shifts";

interface ShiftActionsProps {
  shiftId: string;
  status: string;
}

export function ShiftActions({ shiftId, status }: ShiftActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setLoading("cancel");
    setError(null);
    const result = await cancelShift(shiftId);
    if (!result.success) {
      setError(result.error ?? "Failed to cancel shift.");
      setLoading(null);
      return;
    }
    router.refresh();
    setLoading(null);
  }

  async function handleComplete() {
    setLoading("complete");
    setError(null);
    const result = await completeShift(shiftId);
    if (!result.success) {
      setError(result.error ?? "Failed to complete shift.");
      setLoading(null);
      return;
    }
    router.refresh();
    setLoading(null);
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      <div className="flex gap-3">
        {status === "ASSIGNED" && (
          <button
            onClick={handleComplete}
            disabled={loading !== null}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading === "complete" ? "Completing..." : "Complete Shift"}
          </button>
        )}
        {(status === "OPEN" || status === "ASSIGNED") && (
          <button
            onClick={handleCancel}
            disabled={loading !== null}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading === "cancel" ? "Cancelling..." : "Cancel Shift"}
          </button>
        )}
      </div>
    </div>
  );
}
