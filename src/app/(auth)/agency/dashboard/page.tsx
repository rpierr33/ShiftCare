export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Plus,
  Briefcase,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  MapPin,
  ChevronRight,
  Lightbulb,
  X,
  Bell,
  CalendarCheck,
  AlertCircle,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { StatusBadge } from "@/components/shared/status-badge";
import { StarDisplay } from "@/components/shared/star-display";
import { DismissableCard } from "./dismissable-card";

const ROLE_SHORT: Record<string, string> = {
  RN: "RN",
  LPN: "LPN",
  CNA: "CNA",
  HHA: "HHA",
  MEDICAL_ASSISTANT: "MA",
  COMPANION: "COMP",
  OTHER: "OTH",
};

const ROLE_BADGE_COLOR: Record<string, string> = {
  RN: "bg-purple-100 text-purple-700",
  LPN: "bg-indigo-100 text-indigo-700",
  CNA: "bg-teal-100 text-teal-700",
  HHA: "bg-orange-100 text-orange-700",
  MEDICAL_ASSISTANT: "bg-cyan-100 text-cyan-700",
  COMPANION: "bg-pink-100 text-pink-700",
  OTHER: "bg-gray-100 text-gray-700",
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  shift_accepted: CheckCircle,
  shift_cancelled: AlertCircle,
  shift_completed: CalendarCheck,
  shift_invitation: Users,
};

export default async function AgencyDashboardPage() {
  const user = await getSessionUser();

  const providerProfile = await db.providerProfile.findUnique({
    where: { userId: user.id },
    select: { providerType: true, companyName: true },
  });

  const isPrivate = providerProfile?.providerType === "PRIVATE";

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalShifts,
    openShifts,
    filledThisMonth,
    completedShifts,
    activeShifts,
    shiftsNeedingConfirmation,
    notifications,
    avgFillTimeResult,
    completedShiftsForSpend,
  ] = await Promise.all([
    db.shift.count({ where: { providerId: user.id } }),
    db.shift.count({ where: { providerId: user.id, status: "OPEN" } }),
    db.shift.count({
      where: {
        providerId: user.id,
        status: { in: ["ASSIGNED", "COMPLETED"] },
        assignedAt: { gte: startOfMonth },
      },
    }),
    db.shift.count({ where: { providerId: user.id, status: "COMPLETED" } }),
    db.shift.findMany({
      where: { providerId: user.id, status: { in: ["OPEN", "ASSIGNED"] } },
      include: {
        assignedWorker: { select: { name: true, id: true } },
      },
      orderBy: { startTime: "asc" },
      take: 5,
    }),
    // Shifts that ended but haven't been confirmed as completed
    db.shift.findMany({
      where: {
        providerId: user.id,
        status: { in: ["ASSIGNED", "IN_PROGRESS"] },
        endTime: { lt: now },
      },
      include: {
        assignedWorker: { select: { name: true, id: true } },
      },
      orderBy: { endTime: "asc" },
    }),
    db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    // Average fill time: avg(assignedAt - createdAt) for assigned shifts
    db.shift.findMany({
      where: {
        providerId: user.id,
        status: { in: ["ASSIGNED", "COMPLETED"] },
        assignedAt: { not: null },
      },
      select: { createdAt: true, assignedAt: true },
      take: 100,
      orderBy: { assignedAt: "desc" },
    }),
    // Total spent (for private payers): sum of completed shift costs
    isPrivate
      ? db.shift.findMany({
          where: { providerId: user.id, status: "COMPLETED" },
          select: { payRate: true, startTime: true, endTime: true },
        })
      : Promise.resolve([]),
  ]);

  // Calculate average fill time
  let avgFillTimeHours = 0;
  if (avgFillTimeResult.length > 0) {
    const totalMs = avgFillTimeResult.reduce((sum, s) => {
      if (!s.assignedAt) return sum;
      return sum + (s.assignedAt.getTime() - s.createdAt.getTime());
    }, 0);
    avgFillTimeHours = Math.round((totalMs / avgFillTimeResult.length / (1000 * 60 * 60)) * 10) / 10;
  }

  const firstName = user.name?.split(" ")[0] ?? "there";

  // Calculate total spent for private payers
  const totalSpent = completedShiftsForSpend.reduce((sum, s) => {
    const hours = (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / (1000 * 60 * 60);
    return sum + parseFloat(String(s.payRate)) * hours;
  }, 0);

  // Query worker ratings for assigned workers in active shifts
  const assignedWorkerIds = activeShifts
    .filter((s) => s.assignedWorker?.id)
    .map((s) => s.assignedWorker!.id);
  const uniqueWorkerIds = [...new Set(assignedWorkerIds)];
  const workerRatingsData = uniqueWorkerIds.length > 0
    ? await db.rating.groupBy({
        by: ["rateeId"],
        where: { rateeId: { in: uniqueWorkerIds } },
        _avg: { score: true },
        _count: true,
      })
    : [];
  const workerRatingsMap = new Map(
    workerRatingsData.map((r) => [r.rateeId, { average: r._avg.score ?? 0, count: r._count }])
  );

  // Extract patient name from companyName (format: "[Name]'s Care")
  const patientName = providerProfile?.companyName?.replace(/'s Care$/, "") ?? "";

  // ─── Private Payer Dashboard ───────────────────────────────────────
  if (isPrivate) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Welcome, {firstName}
            </h1>
            <p className="text-slate-500 mt-1">
              {patientName ? `Find care for ${patientName}.` : "Manage your care needs."}
            </p>
          </div>
          <Link
            href="/agency/shifts/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/20 hover:shadow-xl hover:shadow-violet-600/30 text-sm"
          >
            <Plus className="h-4 w-4" />
            Post a Shift
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active</p>
                <p className="text-2xl font-bold text-violet-600 mt-1">{openShifts}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-violet-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Completed</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{completedShifts}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Spent</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">${totalSpent.toFixed(0)}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link
            href="/agency/shifts/new"
            className="flex items-center gap-4 bg-gradient-to-br from-violet-600 to-violet-700 text-white rounded-2xl p-5 hover:from-violet-700 hover:to-violet-800 transition-all shadow-lg shadow-violet-600/15 group"
          >
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">Post a Shift</p>
              <p className="text-sm text-violet-200">Find a caregiver fast</p>
            </div>
            <ChevronRight className="h-5 w-5 ml-auto opacity-60 group-hover:opacity-100 transition-opacity" />
          </Link>

          <Link
            href="/agency/shifts?tab=COMPLETED"
            className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl p-5 hover:border-violet-300 hover:shadow-md transition-all group"
          >
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">View Past Shifts</p>
              <p className="text-sm text-slate-500">Review completed shifts</p>
            </div>
            <ChevronRight className="h-5 w-5 ml-auto text-slate-300 group-hover:text-violet-600 transition-colors" />
          </Link>
        </div>

        {/* Shifts Needing Completion Confirmation */}
        {shiftsNeedingConfirmation.length > 0 && (
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <h2 className="text-sm font-semibold text-amber-900">
                {shiftsNeedingConfirmation.length} shift{shiftsNeedingConfirmation.length > 1 ? "s" : ""} awaiting your confirmation
              </h2>
            </div>
            <p className="text-xs text-amber-700 mb-4">Confirm completion so workers can be paid.</p>
            <div className="space-y-2">
              {shiftsNeedingConfirmation.map((shift) => (
                <div key={shift.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-amber-100">
                  <div>
                    <span className="text-sm font-semibold text-slate-900">{shift.role}</span>
                    <span className="text-sm text-slate-500 ml-2">
                      {shift.assignedWorker?.name || "Unknown worker"}
                    </span>
                    <span className="text-xs text-slate-400 ml-2">
                      Ended {new Date(shift.endTime).toLocaleDateString()}
                    </span>
                  </div>
                  <Link
                    href={`/agency/shifts/${shift.id}`}
                    className="px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    Confirm
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Shifts */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Active Shifts</h2>
            <Link
              href="/agency/shifts?tab=OPEN"
              className="text-sm text-violet-600 hover:text-violet-700 font-medium"
            >
              View all
            </Link>
          </div>

          {activeShifts.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-violet-50 flex items-center justify-center mb-3">
                <Briefcase className="h-6 w-6 text-violet-600" />
              </div>
              <p className="text-sm font-medium text-slate-900 mb-1">No open shifts</p>
              <p className="text-sm text-slate-500 mb-4">
                Post a shift to find a caregiver.
              </p>
              <Link
                href="/agency/shifts/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Post a Shift
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {activeShifts.map((shift) => (
                <Link
                  key={shift.id}
                  href={`/agency/shifts/${shift.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors group"
                >
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${ROLE_BADGE_COLOR[shift.role] ?? "bg-gray-100 text-gray-700"}`}>
                    {ROLE_SHORT[shift.role] ?? shift.role}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {shift.title || `${shift.role} Shift`}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(shift.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        {" "}
                        {new Date(shift.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {shift.location.split(",")[0]}
                      </span>
                      {shift.assignedWorker && (
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {shift.assignedWorker.name}
                          {(() => {
                            const wr = workerRatingsMap.get(shift.assignedWorker!.id);
                            return wr && wr.count > 0 ? <StarDisplay average={wr.average} count={wr.count} /> : null;
                          })()}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-bold text-emerald-600">
                    ${parseFloat(String(shift.payRate)).toFixed(0)}/hr
                  </p>
                  <StatusBadge status={shift.status} variant="pill" />
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-violet-600 transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Agency Dashboard (default) ────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-slate-500 mt-1">
            Your shift command center
          </p>
        </div>
        <Link
          href="/agency/shifts/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-600/20 hover:shadow-xl hover:shadow-cyan-600/30 text-sm"
        >
          <Plus className="h-4 w-4" />
          Post a Shift
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Posted</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalShifts}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-slate-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Open Now</p>
              <p className="text-2xl font-bold text-cyan-600 mt-1">{openShifts}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-cyan-50 flex items-center justify-center">
              <Clock className="h-5 w-5 text-cyan-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Filled This Month</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{filledThisMonth}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Avg Fill Time</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {avgFillTimeResult.length > 0 ? `${avgFillTimeHours}h` : "--"}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Shifts Panel (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shifts Needing Completion Confirmation */}
          {shiftsNeedingConfirmation.length > 0 && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <h2 className="text-sm font-semibold text-amber-900">
                  {shiftsNeedingConfirmation.length} shift{shiftsNeedingConfirmation.length > 1 ? "s" : ""} awaiting your confirmation
                </h2>
              </div>
              <p className="text-xs text-amber-700 mb-4">Confirm completion so workers can be paid.</p>
              <div className="space-y-2">
                {shiftsNeedingConfirmation.map((shift) => (
                  <div key={shift.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-amber-100">
                    <div>
                      <span className="text-sm font-semibold text-slate-900">{shift.role}</span>
                      <span className="text-sm text-slate-500 ml-2">
                        {shift.assignedWorker?.name || "Unknown worker"}
                      </span>
                      <span className="text-xs text-slate-400 ml-2">
                        Ended {new Date(shift.endTime).toLocaleDateString()}
                      </span>
                    </div>
                    <Link
                      href={`/agency/shifts/${shift.id}`}
                      className="px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors"
                    >
                      Confirm
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Shifts */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Active Shifts</h2>
              <Link
                href="/agency/shifts?tab=OPEN"
                className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
              >
                View all
              </Link>
            </div>

            {activeShifts.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-cyan-50 flex items-center justify-center mb-3">
                  <Briefcase className="h-6 w-6 text-cyan-600" />
                </div>
                <p className="text-sm font-medium text-slate-900 mb-1">No open shifts</p>
                <p className="text-sm text-slate-500 mb-4">
                  Post your first shift to start filling positions.
                </p>
                <Link
                  href="/agency/shifts/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white text-sm font-semibold rounded-lg hover:bg-cyan-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Post a Shift
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {activeShifts.map((shift) => (
                  <Link
                    key={shift.id}
                    href={`/agency/shifts/${shift.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors group"
                  >
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${ROLE_BADGE_COLOR[shift.role] ?? "bg-gray-100 text-gray-700"}`}>
                      {ROLE_SHORT[shift.role] ?? shift.role}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {shift.title || `${shift.role} Shift`}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(shift.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          {" "}
                          {new Date(shift.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {shift.location.split(",")[0]}
                        </span>
                        {shift.assignedWorker && (
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {shift.assignedWorker.name}
                            {(() => {
                              const wr = workerRatingsMap.get(shift.assignedWorker!.id);
                              return wr && wr.count > 0 ? <StarDisplay average={wr.average} count={wr.count} /> : null;
                            })()}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-bold text-emerald-600">
                      ${parseFloat(String(shift.payRate)).toFixed(0)}/hr
                    </p>
                    <StatusBadge status={shift.status} variant="pill" />
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-cyan-600 transition-colors" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/agency/shifts/new"
              className="flex items-center gap-4 bg-gradient-to-br from-cyan-600 to-cyan-700 text-white rounded-2xl p-5 hover:from-cyan-700 hover:to-cyan-800 transition-all shadow-lg shadow-cyan-600/15 group"
            >
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Plus className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold">Post a Shift</p>
                <p className="text-sm text-cyan-100">Fill positions in hours</p>
              </div>
              <ChevronRight className="h-5 w-5 ml-auto opacity-60 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link
              href="/agency/workers"
              className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl p-5 hover:border-cyan-300 hover:shadow-md transition-all group"
            >
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Browse Workers</p>
                <p className="text-sm text-slate-500">View your workforce</p>
              </div>
              <ChevronRight className="h-5 w-5 ml-auto text-slate-300 group-hover:text-cyan-600 transition-colors" />
            </Link>
          </div>

          {/* How Matching Works */}
          <DismissableCard />
        </div>

        {/* Right column: Activity Feed (1/3 width) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>
              <Link
                href="/agency/notifications"
                className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
              >
                View all
              </Link>
            </div>

            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No activity yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map((notif) => {
                  const Icon = NOTIFICATION_ICONS[notif.type] || Bell;
                  return (
                    <div
                      key={notif.id}
                      className={`px-5 py-3 ${!notif.read ? "bg-cyan-50/30" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${!notif.read ? "text-cyan-600" : "text-slate-400"}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-snug ${!notif.read ? "text-slate-900 font-medium" : "text-slate-600"}`}>
                            {notif.title}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {formatRelativeTime(notif.createdAt)}
                          </p>
                        </div>
                        {!notif.read && (
                          <span className="h-2 w-2 rounded-full bg-cyan-500 flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
