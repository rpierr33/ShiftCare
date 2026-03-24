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
} from "lucide-react";
import { ActivityFeed } from "@/components/shared/activity-feed";
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-slate-500 mt-1.5 text-base">
            Manage your shifts and track fulfillment
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

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {/* Open Shifts */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-emerald-500 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Open Shifts</p>
              <p className="text-3xl font-bold text-slate-900 mt-1.5 tracking-tight">
                {openShifts}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Assigned */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-cyan-500 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Assigned</p>
              <p className="text-3xl font-bold text-slate-900 mt-1.5 tracking-tight">
                {assignedShifts}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-cyan-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-cyan-600" />
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-slate-400 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Completed</p>
              <p className="text-3xl font-bold text-slate-900 mt-1.5 tracking-tight">
                {completedShifts}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-slate-500" />
            </div>
          </div>
        </div>

        {/* Plan Usage */}
        {isAtLimit ? (
          <div className="rounded-2xl shadow-sm border border-amber-200 p-6 bg-gradient-to-r from-amber-50 to-red-50 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-red-700">Plan Limit Reached</p>
                <p className="text-3xl font-bold text-red-800 mt-1.5 tracking-tight">
                  {shiftsUsed}
                  <span className="text-lg font-normal text-red-400">
                    /{shiftsLimit}
                  </span>
                </p>
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
                <p className="text-3xl font-bold text-slate-900 mt-1.5 tracking-tight">
                  {shiftsUsed}
                  <span className="text-lg font-normal text-slate-400">
                    /{shiftsLimit === Infinity ? "\u221e" : shiftsLimit}
                  </span>
                </p>
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

      {/* Live Activity Feed */}
      <div className="mb-10">
        <ActivityFeed variant="compact" maxItems={4} />
      </div>

      {/* Shifts Section */}
      <div className="flex items-center justify-between mb-6">
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

            return (
              <Link
                key={shift.id}
                href={`/provider/shifts/${shift.id}`}
                className="group block bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
              >
                <div className="flex">
                  {/* Left color stripe */}
                  <div
                    className={`w-1 flex-shrink-0 rounded-l-2xl ${STATUS_COLOR[shift.status] ?? "bg-slate-300"}`}
                  />

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

                          {/* Status badge */}
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[shift.status] ?? "bg-gray-100 text-gray-800"}`}
                          >
                            {shift.status}
                          </span>

                          {/* Applicant count badge */}
                          {shift.status === "OPEN" && (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                applicantCount > 0
                                  ? "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-600/20"
                                  : "bg-slate-50 text-slate-500 ring-1 ring-slate-200"
                              }`}
                            >
                              <Users className="h-3 w-3" />
                              {applicantCount > 0
                                ? `${applicantCount} applicant${applicantCount !== 1 ? "s" : ""}`
                                : "Waiting for applicants"}
                            </span>
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

                        {shift.assignedWorker && (
                          <p className="text-sm text-cyan-600 mt-2.5 flex items-center gap-1.5 font-medium">
                            <Users className="h-3.5 w-3.5" />
                            Assigned to {shift.assignedWorker.name}
                          </p>
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
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
