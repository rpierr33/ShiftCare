import {
  getProviderShiftPayments,
  getUnfundedShifts,
  getPaymentMethods,
  getProviderTransactions,
} from "@/actions/payments";
import { DollarSign, AlertTriangle, CreditCard, Shield, Clock } from "lucide-react";
import { FundShiftButton, AddPaymentMethodForm, ReleasePayoutButton } from "./payment-actions";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    FAILED: "bg-red-50 text-red-700 border-red-200",
    PROCESSING: "bg-cyan-50 text-cyan-700 border-cyan-200",
    AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
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

export default async function ProviderPaymentsPage() {
  const [unfundedShifts, paymentMethods, fundedShifts, transactions] =
    await Promise.all([
      getUnfundedShifts(),
      getPaymentMethods(),
      getProviderShiftPayments(),
      getProviderTransactions(),
    ]);

  const hasUnfunded = unfundedShifts.length > 0;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Fund shifts, manage payment methods, and track transactions.
        </p>
      </div>

      {/* ── Section 1: Unfunded Shifts ───────────────────────────────── */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          {hasUnfunded && <AlertTriangle className="h-5 w-5 text-amber-500" />}
          <h2 className="text-lg font-bold text-slate-900">Unfunded Shifts</h2>
          {hasUnfunded && (
            <span className="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              {unfundedShifts.length} action{unfundedShifts.length !== 1 ? "s" : ""} needed
            </span>
          )}
        </div>

        {hasUnfunded ? (
          <div className="space-y-3">
            {unfundedShifts.map((shift) => {
              const hours =
                (new Date(shift.endTime).getTime() -
                  new Date(shift.startTime).getTime()) /
                (1000 * 60 * 60);
              const total = parseFloat((hours * shift.payRate).toFixed(2));
              return (
                <div
                  key={shift.id}
                  className="bg-white rounded-2xl border border-amber-200 p-5 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                          {shift.role}
                        </span>
                        <span className="font-semibold text-slate-900 text-sm">
                          {shift.title || `${shift.role} Shift`}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">
                        {shift.assignedWorker?.name ?? "Worker"} &middot;{" "}
                        {shift.location}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(shift.startTime).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        &middot; {hours.toFixed(1)} hrs &middot; $
                        {parseFloat(String(shift.payRate)).toFixed(2)}/hr
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-slate-900">
                        ${total.toFixed(2)}
                      </p>
                      <FundShiftButton shiftId={shift.id} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <Shield className="h-7 w-7 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">
              All assigned shifts are funded. You&apos;re all set.
            </p>
          </div>
        )}
      </section>

      {/* ── Section 2: Payment Methods ───────────────────────────────── */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Payment Methods</h2>
        </div>

        {paymentMethods.length > 0 ? (
          <div className="space-y-3 mb-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {method.type === "card"
                        ? `${method.brand ?? "Card"} ending in ${method.last4}`
                        : `${method.bankName ?? "Bank"} ending in ${method.last4}`}
                    </p>
                    {method.type === "card" &&
                      method.expiryMonth &&
                      method.expiryYear && (
                        <p className="text-xs text-slate-400">
                          Expires {String(method.expiryMonth).padStart(2, "0")}/
                          {method.expiryYear}
                        </p>
                      )}
                  </div>
                </div>
                {method.isDefault && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                    Default
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center mb-4">
            <CreditCard className="h-7 w-7 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">
              No payment methods on file. Add one to fund shifts.
            </p>
          </div>
        )}

        <AddPaymentMethodForm />
      </section>

      {/* ── Section 3: Funded Shifts ─────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Funded Shifts</h2>

        {fundedShifts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <DollarSign className="h-7 w-7 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">
              No funded shifts yet. Fund an assigned shift above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {fundedShifts.map((sp) => {
              const canRelease =
                sp.fundingStatus === "COMPLETED" &&
                (!sp.payoutStatus || sp.payoutStatus === "PENDING");
              return (
                <div
                  key={sp.id}
                  className="bg-white rounded-2xl border border-slate-100 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                          {sp.shift.role}
                        </span>
                        <span className="font-semibold text-slate-900 text-sm">
                          {sp.shift.title || `${sp.shift.role} Shift`}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">
                        {sp.worker?.name ?? "Worker"} &middot; {sp.shift.location}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(sp.shift.startTime).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" }
                        )}{" "}
                        &middot; Shift Total: $
                        {parseFloat(String(sp.shiftAmount)).toFixed(2)} &middot;
                        Fee: ${parseFloat(String(sp.platformFee)).toFixed(2)}{" "}
                        &middot; Worker Payout: $
                        {parseFloat(String(sp.workerPayout)).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 space-y-2">
                      <div className="flex items-center gap-2 justify-end">
                        <StatusBadge status={sp.fundingStatus} />
                        {sp.payoutStatus && (
                          <StatusBadge status={sp.payoutStatus} />
                        )}
                      </div>
                      {canRelease && (
                        <ReleasePayoutButton shiftId={sp.shiftId} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Section 4: Transaction History ───────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          Transaction History
        </h2>

        {transactions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <Clock className="h-7 w-7 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No transactions yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Type
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Shift
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">
                      Amount
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">
                      Fee
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">
                      Net
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">
                      Status
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                          {tx.type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-700">
                        {tx.shift?.title || tx.shift?.role || tx.description}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-slate-900 text-right">
                        ${parseFloat(String(tx.amount)).toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500 text-right">
                        ${parseFloat(String(tx.platformFee)).toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-slate-900 text-right">
                        ${parseFloat(String(tx.netAmount)).toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500 text-right whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
