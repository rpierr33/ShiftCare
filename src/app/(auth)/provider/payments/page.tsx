import Link from "next/link";
import { DollarSign, Calendar, CheckCircle, Clock, ArrowRight, AlertCircle } from "lucide-react";
import { getProviderPayments, getUnpaidCompletedShifts } from "@/actions/payments";
import { PaymentActions } from "./payment-actions";

export default async function PaymentsPage() {
  const [payments, unpaidShifts] = await Promise.all([
    getProviderPayments(),
    getUnpaidCompletedShifts(),
  ]);

  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.totalAmount, 0);
  const totalScheduled = payments
    .filter((p) => p.status === "SCHEDULED")
    .reduce((sum, p) => sum + p.totalAmount, 0);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Manage payroll for completed shifts
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Paid</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">${totalPaid.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Scheduled</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">${totalScheduled.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Awaiting Payment</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{unpaidShifts.length} shift{unpaidShifts.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Unpaid completed shifts */}
      {unpaidShifts.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Completed Shifts — Schedule Payment
          </h2>
          <div className="space-y-3">
            {unpaidShifts.map((shift) => {
              const hours = (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60);
              const total = hours * shift.payRate;
              return (
                <div key={shift.id} className="bg-white rounded-2xl border border-amber-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">{shift.role}</span>
                        <span className="font-semibold text-slate-900 text-sm">{shift.title || `${shift.role} Shift`}</span>
                      </div>
                      <p className="text-sm text-slate-500">{shift.assignedWorker?.name ?? "Worker"} &middot; {shift.location}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(shift.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })} &middot;
                        {hours.toFixed(1)} hrs &middot; ${shift.payRate.toFixed(2)}/hr
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-slate-900">${total.toFixed(2)}</p>
                      <PaymentActions shiftId={shift.id} workerName={shift.assignedWorker?.name ?? "Worker"} amount={total} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment history */}
      <h2 className="text-lg font-bold text-slate-900 mb-4">Payment History</h2>
      {payments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <DollarSign className="h-8 w-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No payments yet. Complete shifts to start processing payments.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <div key={payment.id} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                  payment.status === "PAID" ? "bg-emerald-100" : "bg-amber-100"
                }`}>
                  {payment.status === "PAID" ? (
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-amber-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {payment.worker.name} &middot; {payment.shift.role} {payment.shift.title ? `— ${payment.shift.title}` : ""}
                  </p>
                  <p className="text-xs text-slate-500">
                    {payment.hoursWorked.toFixed(1)} hrs @ ${payment.hourlyRate.toFixed(2)}/hr &middot;
                    {payment.scheduledDate
                      ? ` Pay by ${new Date(payment.scheduledDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                      : ""}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900">${payment.totalAmount.toFixed(2)}</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  payment.status === "PAID"
                    ? "bg-emerald-50 text-emerald-700"
                    : payment.status === "SCHEDULED"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-slate-100 text-slate-600"
                }`}>
                  {payment.status === "PAID" ? "Paid" : payment.status === "SCHEDULED" ? "Scheduled" : payment.status}
                </span>
                {payment.status === "SCHEDULED" && (
                  <div className="mt-2">
                    <PaymentActions paymentId={payment.id} markPaid />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
