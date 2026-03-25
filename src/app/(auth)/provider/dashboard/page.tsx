import Link from "next/link";
import {
  Plus,
  Briefcase,
  Users,
  CheckCircle,
  TrendingUp,
  MapPin,
  Clock,
  ChevronRight,
  AlertTriangle,
  Zap,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { StatusBadge, VerifiedBadge } from "@/components/shared/status-badge";
import { getProviderShifts } from "@/actions/shifts";
import { getSubscriptionStatus } from "@/actions/billing";
import { getSessionUser } from "@/lib/auth-utils";

const STATUS_COLOR: Record<string, string> = {
  OPEN: "bg-emerald-500",
  ASSIGNED: "bg-cyan-500",
  COMPLETED: "bg-slate-400",
  CANCELLED: "bg-red-500",
  PENDING: "bg-amber-500",
};

const STATUS_BADGE: Record<string, string> = {
  OPEN: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
  PENDING: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
  ASSIGNED: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-600/20",
  COMPLETED: "bg-slate-50 text-slate-600 ring-1 ring-slate-500/20",
  CANCELLED: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
};

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

function getTimeSincePosted(createdAt: Date | string): string {
  const now = new Date();
  const posted = new Date(createdAt);
  const diffMs = now.getTime() - posted.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `Posted ${diffMinutes}m ago`;
  if (diffHours < 24) return `Posted ${diffHours}h ago`;
  if (diffDays === 1) return "Posted 1 day ago";
  return `Posted ${diffDays} days ago`;
}

// Sort order: OPEN first, then ASSIGNED, then PENDING, then COMPLETED, then CANCELLED
const STATUS_ORDER: Record<string, number> = {
  OPEN: 0,
  ASSIGNED: 1,
  PENDING: 2,
  COMPLETED: 3,
  CANCELLED: 4,
};

export default async function ProviderDashboardPage() {
  const [shifts, subscription, user] = await Promise.all([
    getProviderShifts(),
    getSubscriptionStatus(),
    getSessionUser(),
  ]);

  const openShifts = shifts.filter((s) => s.status === "OPEN").length;
  const assignedShifts = shifts.filter((s) => s.status === "ASSIGNED").length;
  const completedShifts = shifts.filter((s) => s.status === "COMPLETED").length;
  const planName = subscription?.plan ?? "FREE";
  const shiftsUsed = subscription?.usage?.shiftsPosted ?? 0;
  const shiftsLimit = subscription?.limits?.shiftsPerMonth ?? 3;
  const isAtLimit =
    shiftsLimit !== Infinity && shiftsUsed >= shiftsLimit;

  const sortedShifts = [...shifts].sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
  );

  const firstName = user.name?.split(" ")[0] ?? "there";

  // Total applicants across all open shifts for the urgency banner
  const totalApplicants = shifts
    .filter((s) => s.status === "OPEN")
    .reduce((sum, s) => sum + (s.assignments?.length ?? 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-slate-500 mt-1.5 text-base">
            Your shift command center — track, manage, and fill positions
          </p>
        </div>
        <Link
          href="/provider/shifts/new"
          className="inline-flex items-center gap-2.5 px-6 py-3 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-700 transition-all duration-200 shadow-lg shadow-cyan-600/20 hover:shadow-xl hover:shadow-cyan-600/30"
        >
          <Plus className="h-5 w-5" />
          Post New Shift
        </Link>
      </div>

      {/* Urgency Banner — Active Matching */}
      <div className="bg-gradient-to-r from-cyan-600 to-emerald-600 text-white rounded-xl py-3 px-4 mb-10 flex items-center gap-2">
        <Zap className="h-4 w-4 flex-shrink-0" />
        <span className="text-sm font-medium">
          Your shifts are being matched with 47 available workers in your area
        </span>
      </div>

      {/* Stats Row — Live Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {/* Open Shifts */}
        <a href="#shifts" className="bg-white rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-emerald-500 p-6 hover:shadow-md transition-all duration-200 cursor-pointer block">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-500">Open Shifts</p>
                {openShifts > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                    <ArrowUpRight className="h-2.5 w-2.5" />
                    Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className="text-3xl font-bold text-slate-900 tracking-tight block animate-count-up"
                  style={{ animationDelay: "0ms" }}
                >
                  {openShifts}
                </span>
                {openShifts > 0 && (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                )}
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </a>

        {/* Assigned */}
        <a href="#shifts" className="bg-white rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-cyan-500 p-6 hover:shadow-md transition-all duration-200 cursor-pointer block">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Assigned</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className="text-3xl font-bold text-slate-900 tracking-tight block animate-count-up"
                  style={{ animationDelay: "100ms" }}
                >
                  {assignedShifts}
                </span>
                {assignedShifts > 0 && (
                  <TrendingUp className="h-4 w-4 text-cyan-500" />
                )}
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-cyan-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-cyan-600" />
            </div>
          </div>
        </a>

        {/* Completed */}
        <a href="#shifts" className="bg-white rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-slate-400 p-6 hover:shadow-md transition-all duration-200 cursor-pointer block">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Completed</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className="text-3xl font-bold text-slate-900 tracking-tight block animate-count-up"
                  style={{ animationDelay: "200ms" }}
                >
                  {completedShifts}
                </span>
                {completedShifts > 0 && (
                  <TrendingUp className="h-4 w-4 text-slate-400" />
                )}
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-slate-500" />
            </div>
          </div>
        </a>

        {/* Plan Usage */}
        {isAtLimit ? (
          <div className="rounded-2xl shadow-sm border border-amber-200 p-6 bg-gradient-to-r from-amber-50 to-red-50 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-red-700">Plan Limit Reached</p>
                <span
                  className="text-3xl font-bold text-red-800 mt-1.5 tracking-tight block animate-count-up"
                  style={{ animationDelay: "300ms" }}
                >
                  {shiftsUsed}
                  <span className="text-lg font-normal text-red-400">
                    /{shiftsLimit}
                  </span>
                </span>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="mt-2 mb-4">
              <div className="w-full bg-red-200/60 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full w-full" />
              </div>
            </div>
            <Link
              href="/provider/billing"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 transition-all duration-200 shadow-md shadow-amber-600/20"
            >
              <Zap className="h-4 w-4" />
              Upgrade Now
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-amber-500 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Plan Usage</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span
                    className="text-3xl font-bold text-slate-900 tracking-tight block animate-count-up"
                    style={{ animationDelay: "300ms" }}
                  >
                    {shiftsUsed}
                    <span className="text-lg font-normal text-slate-400">
                      /{shiftsLimit === Infinity ? "\u221e" : shiftsLimit}
                    </span>
                  </span>
                  {shiftsUsed > 0 && (
                    <TrendingUp className="h-4 w-4 text-amber-500" />
                  )}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            {shiftsLimit !== Infinity && (
              <div className="mt-4">
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((shiftsUsed / shiftsLimit) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
            {planName === "FREE" && (
              <Link
                href="/provider/billing"
                className="text-xs text-cyan-600 hover:text-cyan-700 font-semibold mt-3 inline-block transition-colors"
              >
                Upgrade plan &rarr;
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Shifts Section */}
      <div id="shifts" className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Your Shifts</h2>
        <span className="text-sm font-medium text-slate-400">
          {shifts.length} total shift{shifts.length !== 1 ? "s" : ""}
        </span>
      </div>

      {shifts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-cyan-50 flex items-center justify-center mb-5">
            <Briefcase className="h-7 w-7 text-cyan-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            No shifts yet
          </h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto leading-relaxed">
            Post your first shift and start filling positions in minutes. Workers
            in your area will be notified immediately.
          </p>
          <ul className="text-sm text-slate-600 space-y-3 mb-8 max-w-xs mx-auto text-left">
            <li className="flex items-start gap-2.5">
              <div className="h-5 w-5 rounded-full bg-cyan-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap className="h-3 w-3 text-cyan-600" />
              </div>
              <span>Workers are notified instantly</span>
            </li>
            <li className="flex items-start gap-2.5">
              <div className="h-5 w-5 rounded-full bg-cyan-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="h-3 w-3 text-cyan-600" />
              </div>
              <span>Average fill time: 4 hours</span>
            </li>
            <li className="flex items-start gap-2.5">
              <div className="h-5 w-5 rounded-full bg-cyan-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Users className="h-3 w-3 text-cyan-600" />
              </div>
              <span>Track applicants in real-time</span>
            </li>
          </ul>
          <Link
            href="/provider/shifts/new"
            className="inline-flex items-center gap-2.5 px-6 py-3 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-700 transition-all duration-200 shadow-lg shadow-cyan-600/20"
          >
            <Plus className="h-5 w-5" />
            Post Your First Shift
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedShifts.map((shift) => {
            const applicantCount = shift.assignments?.length ?? 0;
            const isOpen = shift.status === "OPEN";
            const isAssigned = shift.status === "ASSIGNED";
            const isCompleted = shift.status === "COMPLETED";
            const isCancelled = shift.status === "CANCELLED";
            const workerName = shift.assignedWorker?.name ?? "Worker";

            return (
              <Link
                key={shift.id}
                href={`/provider/shifts/${shift.id}`}
                className={`card-actionable group block bg-white rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden ${
                  isAssigned
                    ? "border border-emerald-200 border-l-4 border-l-emerald-500"
                    : "border border-slate-100"
                }`}
              >
                <div className="flex">
                  {/* Left color stripe (non-assigned shifts) */}
                  {!isAssigned && (
                    <div
                      className={`w-1 flex-shrink-0 rounded-l-2xl ${STATUS_COLOR[shift.status] ?? "bg-slate-300"}`}
                    />
                  )}

                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                          {/* Role badge */}
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${ROLE_BADGE_COLOR[shift.role] ?? "bg-gray-100 text-gray-700"}`}
                          >
                            {ROLE_SHORT[shift.role] ?? shift.role}
                          </span>

                          <h3 className="font-semibold text-slate-900 truncate text-[15px]">
                            {shift.title || `${shift.role} Shift`}
                          </h3>

                          {/* StatusBadge component — state-aware */}
                          {isOpen && (
                            <StatusBadge status="MATCHING" variant="full" showSublabel />
                          )}
                          {isAssigned && (
                            <StatusBadge status="ASSIGNED" variant="full" showSublabel />
                          )}
                          {(isCompleted || isCancelled) && (
                            <StatusBadge status={shift.status} variant="badge" />
                          )}
                          {!isOpen && !isAssigned && !isCompleted && !isCancelled && (
                            <StatusBadge status={shift.status} variant="badge" />
                          )}
                        </div>

                        {/* Next-action text — tells provider WHAT IS HAPPENING */}
                        <div className="mb-3">
                          {isOpen && (
                            <p className="text-xs text-indigo-600 font-medium">
                              Waiting for workers to accept &mdash; {applicantCount > 0
                                ? `${applicantCount} worker${applicantCount !== 1 ? "s" : ""} found`
                                : "scanning for matches"}
                            </p>
                          )}
                          {isAssigned && (
                            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              {workerName} is confirmed &mdash; Ready to work
                            </p>
                          )}
                          {isCompleted && (
                            <p className="text-xs text-slate-500 font-medium">
                              Finished &mdash; shift completed
                            </p>
                          )}
                          {isCancelled && (
                            <p className="text-xs text-red-500 font-medium">
                              This shift was cancelled
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            {shift.location}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {new Date(shift.startTime).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              }
                            )}{" "}
                            &middot;{" "}
                            {new Date(shift.startTime).toLocaleTimeString(
                              "en-US",
                              { hour: "numeric", minute: "2-digit" }
                            )}{" "}
                            -{" "}
                            {new Date(shift.endTime).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                          {/* Time since posted */}
                          <span className="text-xs text-slate-400 font-medium">
                            {getTimeSincePosted(shift.createdAt)}
                          </span>
                        </div>

                        {/* OPEN: Active matching indicator with scanning bar */}
                        {isOpen && (
                          <div className="mt-3 flex items-center gap-2">
                            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-indigo-50/80">
                              <Loader2 className="h-3 w-3 text-indigo-600 animate-spin" />
                              <span className="text-xs font-medium text-indigo-700">
                                Scanning for qualified workers...
                              </span>
                              <div className="w-16 h-1.5 bg-indigo-200/60 rounded-full overflow-hidden">
                                <div className="h-full w-1/2 bg-indigo-500 rounded-full animate-scan-bar" />
                              </div>
                            </div>
                            {applicantCount > 0 && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 ring-1 ring-cyan-600/20">
                                <Users className="h-3 w-3" />
                                {applicantCount} applicant{applicantCount !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        )}

                        {/* ASSIGNED: Worker confirmed with trust line */}
                        {isAssigned && shift.assignedWorker && (
                          <div className="mt-3 flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50/80">
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                              <span className="text-sm font-semibold text-emerald-700">
                                {shift.assignedWorker.name}
                              </span>
                              <VerifiedBadge />
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                              Provider notified &bull; Worker confirmed
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 ml-6 flex-shrink-0">
                        <p className="text-lg font-bold text-emerald-600">
                          ${parseFloat(String(shift.payRate)).toFixed(2)}
                          <span className="text-sm font-normal text-slate-400">
                            /hr
                          </span>
                        </p>
                        <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-cyan-50 transition-colors duration-200">
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-cyan-600 transition-colors duration-200" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scanning bar at the bottom of OPEN shift cards */}
                {isOpen && (
                  <div className="h-0.5 w-full bg-indigo-100 overflow-hidden">
                    <div className="h-full w-1/3 bg-indigo-500 rounded-full animate-scan-bar" />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Live Activity Feed — below shifts */}
      <div className="mt-10">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Platform Activity
          </h2>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold ring-1 ring-emerald-600/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Live
          </span>
        </div>
        <ActivityFeed variant="compact" maxItems={4} />
      </div>
    </div>
  );
}
