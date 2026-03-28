"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { workerCancelShift } from "@/actions/shifts";
import { XCircle, Loader2, AlertTriangle } from "lucide-react";

interface CancelShiftButtonProps {
  shiftId: string;
  shiftStartTime?: string; // ISO string
}

export function CancelShiftButton({ shiftId, shiftStartTime }: CancelShiftButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Calculate if this is a late cancellation (within 4 hours of start)
  const isLateCancellation = shiftStartTime
    ? (new Date(shiftStartTime).getTime() - Date.now()) < 4 * 60 * 60 * 1000
    : false;

  async function handleCancel() {
    setLoading(true);
    setError("");
    const result = await workerCancelShift(shiftId);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error || "Failed to cancel shift.");
      setLoading(false);
      setConfirming(false);
    }
  }

  if (error) {
    return (
      <div className="mt-2">
        <p className="text-xs text-red-600">{error}</p>
        <button
          onClick={() => setError("")}
          className="text-xs text-slate-500 underline mt-1"
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (confirming) {
    return (
      <div className={`mt-3 rounded-lg border p-3 ${
        isLateCancellation
          ? "border-red-300 bg-red-50"
          : "border-amber-200 bg-amber-50"
      }`}>
        {isLateCancellation ? (
          <>
            <div className="flex items-start gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-red-800 font-bold">
                  Late Cancellation Warning
                </p>
                <p className="text-xs text-red-700 mt-0.5">
                  This shift starts in less than 4 hours. Cancelling now will add a
                  <span className="font-bold"> late cancellation strike</span> to your record.
                </p>
                <ul className="text-xs text-red-600 mt-1 space-y-0.5 list-disc list-inside">
                  <li>1 strike: you see 25% fewer shifts</li>
                  <li>2 strikes: you see 50% fewer shifts</li>
                  <li>3 strikes: account suspended</li>
                </ul>
                <p className="text-xs text-red-600 mt-1">
                  Strikes expire after 90 days of good standing.
                </p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-xs text-amber-800 font-medium mb-2">
            Are you sure you want to cancel this shift? The employer will be notified
            and the shift will be reopened for other workers.
          </p>
        )}
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            {isLateCancellation ? "Cancel Anyway (Strike Applied)" : "Yes, Cancel Shift"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={loading}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 transition-colors"
          >
            Keep Shift
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
    >
      <XCircle className="h-3.5 w-3.5" />
      Cancel Shift
    </button>
  );
}
