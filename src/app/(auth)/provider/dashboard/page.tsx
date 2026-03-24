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
} from "lucide-react";
import { getProviderShifts } from "@/actions/shifts";
import { getSubscriptionStatus } from "@/actions/billing";
import { getSessionUser } from "@/lib/auth-utils";

const STATUS_COLOR: Record<string, string> = {
  OPEN: "bg-emerald-500",
  ASSIGNED: "bg-blue-500",
  COMPLETED: "bg-slate-400",
  CANCELLED: "bg-red-500",
  PENDING: "bg-amber-500",
};

const STATUS_BADGE: Record<string, string> = {
  OPEN: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
  PENDING: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
  ASSIGNED: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20",
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

  const sortedShifts = [...shifts].sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
  );

  const firstName = user.name?.split(" ")[0] ?? "there";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Welcome Banner */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-gray-500 mt-1">
            Manage your shifts and track fulfillment
          </p>
        </div>
        <Link
          href="/provider/shifts/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Post New Shift
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Open Shifts */}
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-emerald-500 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Open Shifts</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {openShifts}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Assigned */}
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-blue-500 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Assigned</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {assignedShifts}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-slate-400 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {completedShifts}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-slate-500" />
            </div>
          </div>
        </div>

        {/* Plan Usage */}
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-amber-500 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Plan Usage</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {shiftsUsed}
                <span className="text-lg font-normal text-gray-400">
                  /{shiftsLimit === Infinity ? "\u221e" : shiftsLimit}
                </span>
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          {shiftsLimit !== Infinity && (
            <div className="mt-3">
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-amber-500 h-1.5 rounded-full transition-all"
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
              className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-2 inline-block"
            >
              Upgrade plan
            </Link>
          )}
        </div>
      </div>

      {/* Shifts Section */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Your Shifts</h2>
        <span className="text-sm text-gray-500">
          {shifts.length} total shift{shifts.length !== 1 ? "s" : ""}
        </span>
      </div>

      {shifts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
            <Briefcase className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No shifts yet
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Post your first shift and start filling positions in minutes. Workers
            in your area will be notified immediately.
          </p>
          <Link
            href="/provider/shifts/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Post Your First Shift
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedShifts.map((shift) => (
            <Link
              key={shift.id}
              href={`/provider/shifts/${shift.id}`}
              className="group block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="flex">
                {/* Left color stripe */}
                <div
                  className={`w-1.5 flex-shrink-0 ${STATUS_COLOR[shift.status] ?? "bg-gray-400"}`}
                />

                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        {/* Role badge */}
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${ROLE_BADGE_COLOR[shift.role] ?? "bg-gray-100 text-gray-700"}`}
                        >
                          {ROLE_SHORT[shift.role] ?? shift.role}
                        </span>

                        <h3 className="font-semibold text-gray-900 truncate">
                          {shift.title || `${shift.role} Shift`}
                        </h3>

                        {/* Status badge */}
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[shift.status] ?? "bg-gray-100 text-gray-800"}`}
                        >
                          {shift.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          {shift.location}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
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
                      </div>

                      {shift.assignedWorker && (
                        <p className="text-sm text-blue-600 mt-2 flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          Assigned to {shift.assignedWorker.name}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                      <p className="text-xl font-bold text-gray-900">
                        ${parseFloat(String(shift.payRate)).toFixed(2)}
                        <span className="text-sm font-normal text-gray-400">
                          /hr
                        </span>
                      </p>
                      <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
