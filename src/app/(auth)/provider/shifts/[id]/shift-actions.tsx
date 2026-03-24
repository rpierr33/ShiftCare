"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { cancelShift, completeShift } from "@/actions/shifts";

interface ShiftActionsProps {
  shiftId: string;
  status: string;
  isAssigned?: boolean;
}

export function ShiftActions({ shiftId, status, isAssigned }: ShiftActionsProps) {
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
    }, 2000);
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
    }, 2000);
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

      {/* Complete success message */}
      {success === "complete" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">
                Shift completed!
              </p>
              <p className="text-sm text-emerald-700 mt-1">
                Payment will be processed.
              </p>
              <Link
                href="/provider/dashboard"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-900 mt-2 transition-colors"
              >
                View Dashboard
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Cancel success message */}
      {success === "cancel" && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-slate-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Shift cancelled successfully.
              </p>
              <Link
                href="/provider/dashboard"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 mt-2 transition-colors"
              >
                View Dashboard
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Cancel confirmation */}
      {confirming && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-4">
          <p className="text-sm font-medium text-gray-900 mb-1">
            Are you sure you want to cancel this shift?
          </p>
          <p className="text-sm text-gray-600 mb-4">
            This will cancel the shift and it cannot be undone.
            {isAssigned && (
              <span className="block mt-1 text-red-700 font-medium">
                The assigned worker will be notified and released from this shift.
              </span>
            )}
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
        <div className="space-y-3">
          {status === "ASSIGNED" && (
            <button
              onClick={handleComplete}
              disabled={loading !== null}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-red-600 text-sm font-semibold rounded-lg border border-red-300 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
