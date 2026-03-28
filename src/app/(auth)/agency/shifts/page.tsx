export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Plus,
  Briefcase,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { BulkShiftActions } from "./bulk-actions";

const TABS = [
  { key: "ALL", label: "All" },
  { key: "OPEN", label: "Open" },
  { key: "ASSIGNED", label: "Assigned" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
] as const;


export default async function AgencyShiftsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab = params.tab ?? "ALL";
  const user = await getSessionUser();

  const where: Record<string, unknown> = { providerId: user.id };
  if (activeTab !== "ALL") {
    where.status = activeTab;
  }

  const shifts = await db.shift.findMany({
    where,
    include: {
      assignedWorker: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Shifts</h1>
          <p className="text-slate-500 text-sm mt-0.5">{shifts.length} shift{shifts.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/agency/shifts/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-700 transition-all shadow-sm text-sm"
        >
          <Plus className="h-4 w-4" />
          Post a Shift
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl shadow-sm border border-slate-100 p-1 mb-6 overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Link
              key={tab.key}
              href={tab.key === "ALL" ? "/agency/shifts" : `/agency/shifts?tab=${tab.key}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Shifts List */}
      {shifts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-cyan-50 flex items-center justify-center mb-4">
            <Briefcase className="h-6 w-6 text-cyan-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {activeTab === "ALL" ? "No shifts yet" : `No ${activeTab.toLowerCase()} shifts`}
          </h3>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
            {activeTab === "ALL"
              ? "Post your first shift to start filling positions."
              : `You don't have any ${activeTab.toLowerCase()} shifts right now.`}
          </p>
          {activeTab === "ALL" && (
            <Link
              href="/agency/shifts/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors text-sm"
            >
              <Plus className="h-4 w-4" />
              Post Your First Shift
            </Link>
          )}
        </div>
      ) : (
        <BulkShiftActions
          shifts={shifts.map((shift) => ({
            id: shift.id,
            role: shift.role,
            title: shift.title,
            isUrgent: shift.isUrgent,
            startTime: shift.startTime.toISOString(),
            endTime: shift.endTime.toISOString(),
            location: shift.location,
            payRate: String(shift.payRate),
            paymentStatus: shift.paymentStatus,
            status: shift.status,
            assignedWorkerName: shift.assignedWorker?.name ?? null,
          }))}
        />
      )}
    </div>
  );
}
