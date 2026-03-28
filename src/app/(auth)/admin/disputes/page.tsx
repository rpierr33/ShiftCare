export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { formatDistanceToNow } from "date-fns";
import { DisputeActions } from "./dispute-actions";

export default async function AdminDisputesPage() {
  await requireAdmin();

  const disputes = await db.shift.findMany({
    where: { status: "DISPUTED" },
    include: {
      provider: { select: { name: true, providerProfile: { select: { companyName: true } } } },
      assignedWorker: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Dispute Resolution</h1>
      <p className="text-sm text-slate-500 mb-8">Review and resolve disputed shifts. Payment is held until resolved.</p>

      {disputes.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <p className="text-slate-500">No open disputes.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((shift) => {
            const gross = shift.grossAmount ? parseFloat(String(shift.grossAmount)) : 0;
            const workerPayout = shift.workerPayoutAmount ? parseFloat(String(shift.workerPayoutAmount)) : 0;
            return (
              <div key={shift.id} className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {shift.role} shift — {shift.provider.providerProfile?.companyName || shift.provider.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Worker: {shift.assignedWorker?.name || "Unknown"} | Filed {formatDistanceToNow(shift.updatedAt, { addSuffix: true })}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full">
                    Payment Held: ${gross.toFixed(2)}
                  </span>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-slate-700 font-medium mb-1">Dispute Reason:</p>
                  <p className="text-sm text-slate-600">{shift.disputeReason || "No reason provided."}</p>
                </div>

                <DisputeActions
                  shiftId={shift.id}
                  workerId={shift.assignedWorker?.id || ""}
                  grossAmount={gross}
                  workerPayout={workerPayout}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
