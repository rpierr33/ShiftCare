import { getWorkerEarnings, getPaymentMethods } from "@/actions/payments";
import { getWorkerProfile } from "@/actions/worker";
import { getMonthlyEarnings } from "@/actions/earnings";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Landmark,
  ArrowRight,
} from "lucide-react";
import { WithdrawButton, AddBankAccountForm } from "./earnings-actions";
import { StripeConnectButton } from "./stripe-connect-button";
import EarningsChart from "@/components/worker/earnings-chart";

function PayoutStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    PROCESSING: "bg-cyan-50 text-cyan-700 border-cyan-200",
    PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
    AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse",
    FAILED: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
        styles[status] ?? "bg-slate-50 text-slate-600 border-slate-200"
      }`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export default async function WorkerEarningsPage() {
  const [earnings, paymentMethods, workerProfile, monthlyEarnings] = await Promise.all([
    getWorkerEarnings(),
    getPaymentMethods(),
    getWorkerProfile(),
    getMonthlyEarnings(),
  ]);

  const stripeAccountStatus = workerProfile?.stripeAccountStatus ?? "NOT_STARTED";

  if (!earnings) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Earnings</h1>
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
          <p className="text-slate-500 text-sm">
            Earnings are only available for worker accounts.
          </p>
        </div>
      </div>
    );
  }

  const bankAccount = paymentMethods.find((m) => m.type === "bank_account");
  const availableAmount = earnings.available.amount;

  const hasAnyEarnings =
    parseFloat(String(earnings.pending.amount)) > 0 ||
    parseFloat(String(earnings.available.amount)) > 0 ||
    parseFloat(String(earnings.paid.amount)) > 0 ||
    earnings.payouts.length > 0;

  if (!hasAnyEarnings) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Earnings</h1>
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-16 px-6 text-center">
          <DollarSign className="h-12 w-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-900 font-semibold text-lg mb-2">
            You haven&apos;t earned yet
          </p>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6 leading-relaxed">
            After completing your first shift, earnings will appear here. Most
            workers in Florida earn $18–$32/hr depending on role.
          </p>
          <Link
            href="/worker/shifts"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-cyan-600/20 hover:bg-cyan-700 transition-all duration-200"
          >
            Find a Shift Near You
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Earnings</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Track your earnings and manage withdrawals.
        </p>
      </div>

      {/* ── Summary Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {/* Pending */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Pending
            </p>
          </div>
          <p className="text-2xl font-bold text-amber-600">
            ${parseFloat(String(earnings.pending.amount)).toFixed(2)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {earnings.pending.count} shift{earnings.pending.count !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Available — highlighted */}
        <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-2xl border-2 border-emerald-200 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/30 rounded-full -mr-8 -mt-8" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                Available
              </p>
            </div>
            <p className="text-3xl font-bold text-emerald-700">
              ${parseFloat(String(availableAmount)).toFixed(2)}
            </p>
            <p className="text-xs text-emerald-600/70 mt-1">
              {earnings.available.count} shift{earnings.available.count !== 1 ? "s" : ""}
            </p>
            {availableAmount > 0 && (
              <div className="mt-4">
                <WithdrawButton maxAmount={parseFloat(String(availableAmount))} />
              </div>
            )}
          </div>
        </div>

        {/* Total Paid */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Paid
            </p>
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            ${parseFloat(String(earnings.paid.amount)).toFixed(2)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {earnings.paid.count} payout{earnings.paid.count !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* ── Monthly Earnings Chart ─────────────────────────────────────── */}
      <EarningsChart data={monthlyEarnings} />

      {/* ── Stripe Connect Setup ──────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Direct Deposit Setup</h2>
        <StripeConnectButton stripeAccountStatus={stripeAccountStatus} />
      </section>

      {/* ── Payout Method ────────────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Payout Method</h2>

        {bankAccount ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between max-w-md">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Landmark className="h-5 w-5 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {bankAccount.bankName ?? "Bank Account"} ending in{" "}
                  {bankAccount.last4}
                </p>
                {bankAccount.isVerified && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                    <CheckCircle className="h-3 w-3" />
                    Verified
                  </p>
                )}
              </div>
            </div>
            {bankAccount.isDefault && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                Default
              </span>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center max-w-md">
            <Landmark className="h-7 w-7 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500 mb-4">
              Add a bank account to withdraw your earnings.
            </p>
          </div>
        )}

        <div className="mt-4">
          <AddBankAccountForm />
        </div>
      </section>

      {/* ── Payout History ───────────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Payout History</h2>

        {earnings.payouts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <DollarSign className="h-7 w-7 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">
              No payouts yet. Earnings from completed shifts will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {earnings.payouts.map((payout) => (
              <div
                key={payout.id}
                className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                      payout.status === "PAID"
                        ? "bg-emerald-100"
                        : payout.status === "PROCESSING"
                        ? "bg-cyan-100"
                        : "bg-amber-100"
                    }`}
                  >
                    {payout.status === "PAID" ? (
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Withdrawal
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(payout.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {payout.processedAt &&
                        ` — Processed ${new Date(
                          payout.processedAt
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}`}
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <p className="text-lg font-bold text-slate-900">
                    ${parseFloat(String(payout.amount)).toFixed(2)}
                  </p>
                  <PayoutStatusBadge status={payout.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
