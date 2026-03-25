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
  const [canRedirect, setCanRedirect] = useState(false);

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
    setCanRedirect(false);
    // 3-second delay before allowing redirect
    setTimeout(() => {
      setCanRedirect(true);
    }, 3000);
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
    setCanRedirect(false);
    setTimeout(() => {
      setCanRedirect(true);
    }, 3000);
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Complete success banner */}
      {success === "complete" && (
        <div className="bg-emerald-600 rounded-xl p-5 mb-4 w-full">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-6 w-6 text-white flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-base font-semibold text-white">
                Shift completed! Payment will be processed within 24 hours.
              </p>
              <div className="flex items-center gap-4 mt-3">
                <span className="text-sm text-emerald-100 underline underline-offset-2 cursor-pointer hover:text-white transition-colors">
                  Rate this worker
                </span>
                {canRedirect ? (
                  <Link
                    href="/provider/dashboard"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-white hover:text-emerald-100 transition-colors"
                  >
                    View Dashboard
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm text-emerald-200">
                    <Spinner />
                    Redirecting shortly...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel success banner */}
      {success === "cancel" && (
        <div className="bg-red-600 rounded-xl p-5 mb-4 w-full">
          <div className="flex items-start gap-3">
            <XCircle className="h-6 w-6 text-white flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-base font-semibold text-white">
                Shift cancelled.{" "}
                {isAssigned && "The worker has been notified and released."}
              </p>
              <div className="mt-3">
                {canRedirect ? (
                  <Link
                    href="/provider/dashboard"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-white hover:text-red-100 transition-colors"
                  >
                    Return to Dashboard
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm text-red-200">
                    <Spinner />
                    Redirecting shortly...
                  </span>
                )}
              </div>
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
              className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 text-white font-semibold rounded-xl py-3 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading === "complete" ? (
                <>
                  <Spinner />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Complete Shift
                </>
              )}
            </button>
          )}
          {(status === "OPEN" || status === "ASSIGNED") && (
            <button
              onClick={() => setConfirming(true)}
              disabled={loading !== null}
              className="w-full inline-flex items-center justify-center gap-2 bg-white border-2 border-red-200 text-red-600 font-semibold rounded-xl py-3 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <XCircle className="h-5 w-5" />
              Cancel Shift
            </button>
          )}
        </div>
      )}
    </div>
  );
}
