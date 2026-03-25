"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestWithdrawal, addPaymentMethod } from "@/actions/payments";
import {
  Loader2,
  CheckCircle,
  DollarSign,
  Landmark,
  Plus,
  ChevronUp,
} from "lucide-react";

// ─── Withdraw Button ────────────────────────────────────────────

export function WithdrawButton({ maxAmount }: { maxAmount: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(maxAmount.toFixed(2));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (parsed > maxAmount) {
      setError(`Maximum withdrawal is $${maxAmount.toFixed(2)}.`);
      return;
    }

    setLoading(true);
    setError("");
    const result = await requestWithdrawal(parsed);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } else {
      setError(result.error || "Withdrawal failed.");
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="flex items-center gap-2 text-emerald-700">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm font-semibold">Withdrawal submitted!</span>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 shadow-sm transition-colors"
      >
        <DollarSign className="h-3.5 w-3.5" />
        Withdraw
      </button>
    );
  }

  return (
    <form
      onSubmit={handleWithdraw}
      className="bg-white/80 backdrop-blur rounded-xl border border-emerald-200 p-4 mt-2"
    >
      <label className="block text-xs font-medium text-slate-700 mb-1.5">
        Amount to withdraw
      </label>
      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
          $
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-xl border border-slate-200 pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>
      <p className="text-xs text-slate-400 mb-3">
        Max: ${maxAmount.toFixed(2)}
      </p>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          Confirm Withdrawal
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError("");
          }}
          className="px-3 py-2.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Add Bank Account Form ──────────────────────────────────────

export function AddBankAccountForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [bankName, setBankName] = useState("");
  const [last4, setLast4] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bankName.trim()) {
      setError("Enter your bank name.");
      return;
    }
    if (last4.length !== 4 || !/^\d{4}$/.test(last4)) {
      setError("Enter the last 4 digits of your account number.");
      return;
    }

    setLoading(true);
    setError("");
    const result = await addPaymentMethod({
      type: "bank_account",
      last4,
      bankName: bankName.trim(),
    });
    if (result.success) {
      setSuccess(true);
      setBankName("");
      setLast4("");
      setTimeout(() => {
        setSuccess(false);
        setOpen(false);
        router.refresh();
      }, 1500);
    } else {
      setError(result.error || "Failed to add bank account.");
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
        Add Bank Account
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
                Bank account added!
              </span>
            </div>
          ) : (
            <>
              <h3 className="text-sm font-bold text-slate-900 mb-4">
                Add Bank Account
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g., Chase, Bank of America"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Last 4 Digits of Account
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
                    <Landmark className="h-4 w-4" />
                  )}
                  Add Account
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
