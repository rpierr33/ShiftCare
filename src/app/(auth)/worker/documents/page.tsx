import { getShiftReceipts } from "@/actions/documents";
import {
  FileText,
  Building,
  Clock,
  DollarSign,
  MapPin,
  Calendar,
} from "lucide-react";
import { DownloadCSVButton } from "./download-csv-button";

function PayoutBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    PROCESSING: "bg-cyan-50 text-cyan-700 border-cyan-200",
    PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
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

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200">
      {role}
    </span>
  );
}

export default async function WorkerDocumentsPage() {
  const receipts = await getShiftReceipts();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-cyan-600" />
            Documents & Receipts
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Proof-of-work receipts for all completed shifts.
          </p>
        </div>
        {receipts.length > 0 && <DownloadCSVButton />}
      </div>

      {/* Empty State */}
      {receipts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-16 px-6 text-center">
          <FileText className="h-12 w-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-900 font-semibold text-lg mb-2">
            No receipts yet
          </p>
          <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
            After completing your first shift, a receipt will be generated here
            automatically. You can download individual receipts or export all as CSV.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {receipts.map((receipt) => {
            const completedDate = receipt.completedAt
              ? new Date(receipt.completedAt)
              : new Date(receipt.endTime);

            return (
              <details
                key={receipt.id}
                className="group bg-white rounded-2xl border border-slate-100 overflow-hidden"
              >
                {/* Summary Row */}
                <summary className="cursor-pointer p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors list-none [&::-webkit-details-marker]:hidden">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-cyan-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {receipt.employer}
                        </p>
                        <RoleBadge role={receipt.role} />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {completedDate.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">
                        ${receipt.netPay.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-400">net pay</p>
                    </div>
                    <PayoutBadge status={receipt.payoutStatus} />
                    <svg
                      className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </div>
                </summary>

                {/* Expanded Detail */}
                <div className="border-t border-slate-100 p-5 bg-slate-50/30">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {/* Employer */}
                    <div className="flex items-start gap-3">
                      <Building className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Employer</p>
                        <p className="text-slate-900 font-medium">{receipt.employer}</p>
                        {(receipt.employerCity || receipt.employerState) && (
                          <p className="text-xs text-slate-400">
                            {[receipt.employerCity, receipt.employerState]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Shift Location</p>
                        <p className="text-slate-900">{receipt.location}</p>
                      </div>
                    </div>

                    {/* Hours */}
                    <div className="flex items-start gap-3">
                      <Clock className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Hours</p>
                        <p className="text-slate-900">
                          {receipt.actualHours
                            ? `${receipt.actualHours.toFixed(1)} hrs (actual)`
                            : `${receipt.scheduledHours.toFixed(1)} hrs (scheduled)`}
                        </p>
                        {receipt.clockIn && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(receipt.clockIn).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                            {receipt.clockOut &&
                              ` - ${new Date(receipt.clockOut).toLocaleTimeString(
                                "en-US",
                                { hour: "numeric", minute: "2-digit" }
                              )}`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Schedule */}
                    <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Scheduled</p>
                        <p className="text-slate-900">
                          {new Date(receipt.startTime).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}{" "}
                          -{" "}
                          {new Date(receipt.endTime).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Pay Breakdown */}
                  <div className="mt-5 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5" />
                      Pay Breakdown
                    </p>
                    <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-100">
                      <div className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-sm text-slate-600">
                          Pay Rate
                        </span>
                        <span className="text-sm font-medium text-slate-900">
                          ${receipt.payRate.toFixed(2)}/hr
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-sm text-slate-600">
                          Gross Pay
                        </span>
                        <span className="text-sm font-medium text-slate-900">
                          ${receipt.grossPay.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-sm text-slate-600">
                          Platform Fee
                        </span>
                        <span className="text-sm font-medium text-red-600">
                          -${receipt.platformFee.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-3 bg-emerald-50/50">
                        <span className="text-sm font-semibold text-slate-900">
                          Net Pay
                        </span>
                        <span className="text-base font-bold text-emerald-700">
                          ${receipt.netPay.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      )}

      {/* Footer note */}
      {receipts.length > 0 && (
        <p className="text-xs text-slate-400 text-center mt-8">
          Showing {receipts.length} completed shift
          {receipts.length !== 1 ? "s" : ""}. Download CSV for a full export.
        </p>
      )}
    </div>
  );
}
