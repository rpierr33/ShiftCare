"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Flag,
} from "lucide-react";
import { confirmShiftCompletion, disputeShift } from "@/actions/agency";
import { cancelShift } from "@/actions/shifts";

interface ShiftDetailActionsProps {
  shiftId: string;
  workerName: string;
  workerPayout: number;
  grossAmount: number;
  cancelOnly?: boolean;
}

const ISSUE_TYPES = [
  "Worker no-show",
  "Worker left early",
  "Wrong credentials",
  "Work quality",
  "Other",
];

export function ShiftDetailActions({
  shiftId,
  workerName,
  workerPayout,
  grossAmount: _grossAmount,
  cancelOnly = false,
}: ShiftDetailActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeType, setDisputeType] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");

  async function handleConfirmCompletion() {
    setLoading(true);
    setError(null);
    const result = await confirmShiftCompletion(shiftId);
    if (!result.success) {
      setError(result.error ?? "Failed to confirm completion.");
      setLoading(false);
      return;
    }
    setSuccess("Shift completed. Payment has been released.");
    setLoading(false);
    setTimeout(() => router.refresh(), 1500);
  }

  async function handleCancel() {
    setLoading(true);
    setError(null);
    const result = await cancelShift(shiftId);
    if (!result.success) {
      setError(result.error ?? "Failed to cancel shift.");
      setLoading(false);
      setConfirmingCancel(false);
      return;
    }
    setSuccess("Shift cancelled.");
    setLoading(false);
    setTimeout(() => router.refresh(), 1500);
  }

  async function handleDispute() {
    if (!disputeType || !disputeDescription.trim()) {
      setError("Please select an issue type and provide a description.");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await disputeShift(shiftId, disputeType, disputeDescription.trim());
    if (!result.success) {
      setError(result.error ?? "Failed to file dispute.");
      setLoading(false);
      return;
    }
    setSuccess("Dispute filed. Our team will review it within 24-48 hours.");
    setLoading(false);
    setTimeout(() => router.refresh(), 1500);
  }

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
          <p className="text-sm font-medium text-emerald-800">{success}</p>
        </div>
      </div>
    );
  }

  // Cancel-only mode for open/assigned shifts before end time
  if (cancelOnly) {
    return (
      <div className="mb-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {confirmingCancel ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <p className="text-sm font-medium text-slate-900 mb-1">
              Cancel this shift?
            </p>
            <p className="text-sm text-slate-600 mb-4">
              This cannot be undone.
              {workerName && (
                <span className="block mt-1 text-red-700 font-medium">
                  {workerName} will be notified and released.
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                {loading ? "Cancelling..." : "Yes, Cancel"}
              </button>
              <button
                onClick={() => setConfirmingCancel(false)}
                disabled={loading}
                className="px-4 py-2 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Keep Shift
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingCancel(true)}
            className="w-full inline-flex items-center justify-center gap-2 bg-white border-2 border-red-200 text-red-600 font-semibold rounded-xl py-3 hover:bg-red-50 transition-colors text-sm"
          >
            <XCircle className="h-4 w-4" />
            Cancel Shift
          </button>
        )}
      </div>
    );
  }

  // Full completion UI
  return (
    <div className="mb-6 space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Dispute Modal */}
      {showDispute ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Flag className="h-5 w-5 text-red-500" />
            <h3 className="text-sm font-semibold text-slate-900">Report an Issue</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Issue Type</label>
              <select
                value={disputeType}
                onChange={(e) => setDisputeType(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">Select an issue...</option>
                {ISSUE_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={disputeDescription}
                onChange={(e) => setDisputeDescription(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Describe the issue in detail..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              />
              <span className="absolute bottom-2 right-3 text-xs text-slate-400">
                {disputeDescription.length}/500
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDispute}
                disabled={loading || !disputeType || !disputeDescription.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
                Submit Dispute
              </button>
              <button
                onClick={() => { setShowDispute(false); setError(null); }}
                disabled={loading}
                className="px-4 py-2 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border-2 border-cyan-200 p-6">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle className="h-5 w-5 text-cyan-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Did {workerName} complete this shift?
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Confirming releases <span className="font-bold">${workerPayout.toFixed(2)}</span> to the worker.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleConfirmCompletion}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Confirm Completion
            </button>
            <button
              onClick={() => setShowDispute(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-red-200 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors"
            >
              <AlertTriangle className="h-4 w-4" />
              Report an Issue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
