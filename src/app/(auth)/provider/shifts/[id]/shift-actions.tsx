"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";
import { cancelShift, completeShift } from "@/actions/shifts";

interface ShiftActionsProps {
  shiftId: string;
  status: string;
}

export function ShiftActions({ shiftId, status }: ShiftActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function handleComplete() {
    setLoading("complete");
    setError(null);
    const result = await completeShift(shiftId);
    if (!result.success) {
      setError(result.error ?? "Failed to complete shift.");
      setLoading(null);
      return;
    }
    setSuccess("complete");
    setLoading(null);
    setTimeout(() => {
      router.refresh();
      setSuccess(null);
    }, 1200);
  }

  async function handleCancel() {
    setLoading("cancel");
    setError(null);
    const result = await cancelShift(shiftId);
    if (!result.success) {
      setError(result.error ?? "Failed to cancel shift.");
      setLoading(null);
      setConfirming(false);
      return;
    }
    setSuccess("cancel");
    setLoading(null);
    setConfirming(false);
    setTimeout(() => {
      router.refresh();
      setSuccess(null);
    }, 1200);
  }

  const Spinner = () => (
    <svg
      className="animate-spin h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <p className="text-sm text-emerald-800">
            {success === "complete"
              ? "Shift marked as complete!"
              : "Shift cancelled successfully."}
          </p>
        </div>
      )}

      {/* Cancel confirmation */}
      {confirming && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-sm text-gray-700 mb-3">
            Are you sure you want to cancel this shift? This action cannot be
            undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={loading !== null}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading === "cancel" ? (
                <>
                  <Spinner />
                  Cancelling...
                </>
              ) : (
                "Yes, Cancel Shift"
              )}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={loading !== null}
              className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Keep Shift
            </button>
          </div>
        </div>
      )}

      {!confirming && !success && (
        <div className="flex gap-3">
          {status === "ASSIGNED" && (
            <button
              onClick={handleComplete}
              disabled={loading !== null}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading === "complete" ? (
                <>
                  <Spinner />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Complete Shift
                </>
              )}
            </button>
          )}
          {(status === "OPEN" || status === "ASSIGNED") && (
            <button
              onClick={() => setConfirming(true)}
              disabled={loading !== null}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-red-600 text-sm font-medium rounded-lg border border-red-300 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <XCircle className="h-4 w-4" />
              Cancel Shift
            </button>
          )}
        </div>
      )}
    </div>
  );
}
