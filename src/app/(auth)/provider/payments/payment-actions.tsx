"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fundShift, addPaymentMethod, releasePayoutToWorker } from "@/actions/payments";
import {
  Loader2,
  CheckCircle,
  CreditCard,
  Plus,
  ChevronDown,
  ChevronUp,
  Send,
} from "lucide-react";

// ─── Fund Shift Button ──────────────────────────────────────────

export function FundShiftButton({ shiftId }: { shiftId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleFund() {
    setLoading(true);
    setError("");
    const result = await fundShift(shiftId);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => router.refresh(), 1200);
    } else {
      setError(result.error || "Failed to fund shift.");
    }
    setLoading(false);
  }

  if (success) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 mt-2">
        <CheckCircle className="h-3.5 w-3.5" />
        Funded!
      </span>
    );
  }

  return (
    <div className="mt-2">
      <button
        onClick={handleFund}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-600 text-white text-xs font-semibold rounded-xl hover:bg-cyan-700 shadow-sm transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <CreditCard className="h-3.5 w-3.5" />
        )}
        Fund Shift
      </button>
      {error && (
        <p className="text-xs text-red-600 mt-1.5 max-w-[200px]">{error}</p>
      )}
    </div>
  );
}

// ─── Release Payout Button ──────────────────────────────────────

export function ReleasePayoutButton({ shiftId }: { shiftId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleRelease() {
    setLoading(true);
    setError("");
    const result = await releasePayoutToWorker(shiftId);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => router.refresh(), 1200);
    } else {
      setError(result.error || "Failed to release payout.");
    }
    setLoading(false);
  }

  if (success) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
        <CheckCircle className="h-3.5 w-3.5" />
        Released!
      </span>
    );
  }

  return (
    <div>
      <button
        onClick={handleRelease}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Send className="h-3 w-3" />
        )}
        Release Payout
      </button>
      {error && (
        <p className="text-xs text-red-600 mt-1 max-w-[200px]">{error}</p>
      )}
    </div>
  );
}

// ─── Add Payment Method Form ────────────────────────────────────

export function AddPaymentMethodForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [last4, setLast4] = useState("");
  const [brand, setBrand] = useState("Visa");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (last4.length !== 4 || !/^\d{4}$/.test(last4)) {
      setError("Enter the last 4 digits of the card number.");
      return;
    }
    const month = parseInt(expiryMonth, 10);
    const year = parseInt(expiryYear, 10);
    if (!month || month < 1 || month > 12) {
      setError("Enter a valid expiry month (1-12).");
      return;
    }
    if (!year || year < 2025 || year > 2040) {
      setError("Enter a valid expiry year.");
      return;
    }

    setLoading(true);
    setError("");
    const result = await addPaymentMethod({
      type: "card",
      last4,
      brand,
      expiryMonth: month,
      expiryYear: year,
    });
    if (result.success) {
      setSuccess(true);
      setLast4("");
      setExpiryMonth("");
      setExpiryYear("");
      setTimeout(() => {
        setSuccess(false);
        setOpen(false);
        router.refresh();
      }, 1500);
    } else {
      setError(result.error || "Failed to add payment method.");
    }
    setLoading(false);
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
      >
        {open ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Add Payment Method
      </button>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 bg-white rounded-2xl border border-slate-200 p-6 max-w-md"
        >
          {success ? (
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-semibold">
                Payment method added!
              </span>
            </div>
          ) : (
            <>
              <h3 className="text-sm font-bold text-slate-900 mb-4">
                Add Card
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Card Brand
                  </label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="Amex">Amex</option>
                    <option value="Discover">Discover</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Last 4 Digits
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={last4}
                    onChange={(e) =>
                      setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    placeholder="1234"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Expiry Month
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={expiryMonth}
                      onChange={(e) =>
                        setExpiryMonth(
                          e.target.value.replace(/\D/g, "").slice(0, 2)
                        )
                      }
                      placeholder="MM"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Expiry Year
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={expiryYear}
                      onChange={(e) =>
                        setExpiryYear(
                          e.target.value.replace(/\D/g, "").slice(0, 4)
                        )
                      }
                      placeholder="2026"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-600 mt-3">{error}</p>
              )}

              <div className="flex gap-2 mt-5">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-cyan-600 text-white text-sm font-semibold rounded-xl hover:bg-cyan-700 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  Add Card
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setError("");
                  }}
                  className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </form>
      )}
    </div>
  );
}
