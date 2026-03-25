"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPayment, markPaymentPaid } from "@/actions/payments";
import { Calendar, CheckCircle, Loader2, DollarSign } from "lucide-react";

// Schedule a payment for a completed shift
export function PaymentActions({
  shiftId,
  workerName,
  amount,
  paymentId,
  markPaid,
}: {
  shiftId?: string;
  workerName?: string;
  amount?: number;
  paymentId?: string;
  markPaid?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSchedule() {
    if (!shiftId || !date) return;
    setLoading(true);
    setError("");

    const result = await createPayment(shiftId, date, notes || undefined);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => router.refresh(), 1500);
    } else {
      setError(result.error || "Failed to schedule payment.");
    }
    setLoading(false);
  }

  async function handleMarkPaid() {
    if (!paymentId) return;
    setLoading(true);
    setError("");

    const result = await markPaymentPaid(paymentId);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => router.refresh(), 1500);
    } else {
      setError(result.error || "Failed to mark as paid.");
    }
    setLoading(false);
  }

  if (success) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
        <CheckCircle className="h-3.5 w-3.5" />
        {markPaid ? "Paid!" : "Scheduled!"}
      </span>
    );
  }

  // Mark as paid button
  if (markPaid && paymentId) {
    return (
      <button
        onClick={handleMarkPaid}
        disabled={loading}
        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <DollarSign className="h-3 w-3" />}
        Mark Paid
      </button>
    );
  }

  // Schedule payment for a shift
  if (!showScheduler) {
    return (
      <button
        onClick={() => setShowScheduler(true)}
        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 text-white text-xs font-semibold rounded-lg hover:bg-cyan-700 transition-colors"
      >
        <Calendar className="h-3 w-3" />
        Schedule Payment
      </button>
    );
  }

  return (
    <div className="mt-3 bg-slate-50 rounded-xl p-4 border border-slate-200 text-left">
      <p className="text-xs font-semibold text-slate-700 mb-2">
        Pay {workerName} — ${amount?.toFixed(2)}
      </p>
      <label className="block text-xs text-slate-500 mb-1">Payment date</label>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm cursor-pointer mb-2"
      />
      <label className="block text-xs text-slate-500 mb-1">Notes (optional)</label>
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="e.g., Direct deposit"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-3"
      />
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSchedule}
          disabled={loading || !date}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
          Confirm
        </button>
        <button
          onClick={() => setShowScheduler(false)}
          className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
