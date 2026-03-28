export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Users,
  Briefcase,
  Shield,
  AlertCircle,
  Lightbulb,
  UserCheck,
  Info,
  Pencil,
  CheckCircle,
  AlertTriangle,
  MapPinOff,
} from "lucide-react";
import { getShiftById } from "@/actions/shifts";
import { ShiftActions } from "./shift-actions";
import { StatusBadge, VerifiedBadge } from "@/components/shared/status-badge";

const STATUS_COLOR: Record<string, string> = {
  OPEN: "bg-emerald-500",
  ASSIGNED: "bg-blue-500",
  COMPLETED: "bg-slate-400",
  CANCELLED: "bg-red-500",
  PENDING: "bg-amber-500",
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

const ROLE_LABELS: Record<string, string> = {
  RN: "Registered Nurse",
  LPN: "Licensed Practical Nurse",
  CNA: "Certified Nursing Assistant",
  HHA: "Home Health Aide",
  MEDICAL_ASSISTANT: "Medical Assistant",
  COMPANION: "Companion",
  OTHER: "Other",
};

const ASSIGNMENT_STATUS_BADGE: Record<string, string> = {
  REQUESTED: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
  HELD: "bg-purple-50 text-purple-700 ring-1 ring-purple-600/20",
  ACCEPTED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
  CONFIRMED: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20",
  REJECTED: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
  CANCELLED: "bg-slate-50 text-slate-600 ring-1 ring-slate-500/20",
};

function getTimeSincePosted(createdAt: Date | string): string {
  const now = new Date();
  const posted = new Date(createdAt);
  const diffMs = now.getTime() - posted.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

export default async function ShiftDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const shift = await getShiftById(id);

  if (!shift) {
    notFound();
  }

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const applicantCount = shift.assignments.length;
  const isAssigned = shift.status === "ASSIGNED";
  const isOpen = shift.status === "OPEN";
  const isCompleted = shift.status === "COMPLETED";
  const isCancelled = shift.status === "CANCELLED";

  // Find the confirmed/accepted assignment for the assigned worker
  const assignedAssignment = isAssigned
    ? shift.assignments.find(
        (a) =>
          a.status === "CONFIRMED" ||
          a.status === "ACCEPTED" ||
          a.workerProfile.user.name === shift.assignedWorker?.name
      )
    : null;

  const arrivalTime = timeFormatter.format(new Date(shift.startTime));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/provider/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        {(shift.status === "OPEN" || shift.status === "ASSIGNED") && (
          <Link
            href={`/provider/shifts/${shift.id}/edit`}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-cyan-700 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit Shift
          </Link>
        )}
      </div>

      {/* Assigned Worker Hero Card */}
      {isAssigned && shift.assignedWorker && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 overflow-hidden mb-6">
          <div className="h-1.5 bg-blue-500" />
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserCheck className="h-5 w-5 text-blue-600" />
              <h2 className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                Assigned Worker
              </h2>
            </div>
            <div className="flex items-center gap-5">
              {/* Green success ring around avatar */}
              <div className="relative flex-shrink-0">
                <div className="h-16 w-16 rounded-full bg-white border-2 border-emerald-400 ring-4 ring-emerald-100 flex items-center justify-center">
                  <span className="text-xl font-bold text-blue-600">
                    {shift.assignedWorker.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </span>
                </div>
                {/* Green check indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-white">
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-gray-900">
                    {shift.assignedWorker.name}
                  </h3>
                  <VerifiedBadge />
                </div>
                <p className="text-sm text-blue-600 font-medium mt-0.5">
                  {ROLE_LABELS[shift.role] ?? shift.role}
                </p>
                <p className="text-sm text-emerald-700 font-medium mt-1">
                  Confirmed &middot; Worker will arrive at {arrivalTime}
                </p>
                {assignedAssignment &&
                  assignedAssignment.workerProfile.credentials.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Shield className="h-4 w-4 text-emerald-500" />
                      {assignedAssignment.workerProfile.credentials.map(
                        (c, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                          >
                            {c.name}
                          </span>
                        )
                      )}
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clock-In Status */}
      {(isAssigned || isCompleted) && shift.timeEntries && shift.timeEntries.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-5">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              Attendance
            </h3>
            {shift.timeEntries.map((entry) => {
              const clockInTime = new Intl.DateTimeFormat("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              }).format(new Date(entry.clockInTime));

              const isOnSite = entry.clockInStatus === "ON_SITE";
              const isOffSite = entry.clockInStatus === "OFF_SITE";
              const noLocation = entry.clockInStatus === "NO_LOCATION";

              return (
                <div key={entry.id} className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isOnSite ? "bg-emerald-100" : isOffSite ? "bg-amber-100" : "bg-gray-100"
                  }`}>
                    {isOnSite && <CheckCircle className="h-5 w-5 text-emerald-600" />}
                    {isOffSite && <AlertTriangle className="h-5 w-5 text-amber-600" />}
                    {noLocation && <MapPinOff className="h-5 w-5 text-gray-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {entry.worker.name} clocked in at {clockInTime}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        isOnSite
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                          : isOffSite
                          ? "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                          : "bg-gray-50 text-gray-600 ring-1 ring-gray-500/20"
                      }`}>
                        {isOnSite ? "On-site" : isOffSite ? "Off-site" : "No GPS"}
                      </span>
                    </div>
                    {entry.distanceMiles != null && (
                      <p className={`text-xs mt-0.5 ${isOnSite ? "text-emerald-600" : "text-amber-600"}`}>
                        {entry.distanceMiles < 0.1
                          ? "At shift location"
                          : `${entry.distanceMiles} mi from shift location`}
                      </p>
                    )}
                    {noLocation && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Worker did not share location
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No clock-in yet for assigned shifts that have started */}
      {isAssigned && shift.timeEntries && shift.timeEntries.length === 0 && new Date(shift.startTime) <= new Date() && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Worker has not clocked in yet
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                The shift has started but {shift.assignedWorker?.name || "the worker"} hasn&apos;t recorded their attendance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* OPEN/MATCHING: Active matching state card */}
      {isOpen && (
        <div className="bg-gradient-to-br from-cyan-50 to-indigo-50 rounded-xl shadow-sm border border-cyan-200 overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Your shift is being matched with available workers
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Posted {getTimeSincePosted(shift.createdAt)}
                </p>
              </div>
            </div>
            {/* Animated scanning bar */}
            <div className="w-full h-1.5 bg-cyan-100 rounded-full overflow-hidden mb-4">
              <div className="h-full w-1/3 bg-cyan-500 rounded-full animate-pulse" />
            </div>
            <p className="text-sm font-medium text-cyan-800">
              Workers who match: <span className="font-bold">{applicantCount}</span> found so far
            </p>
          </div>
        </div>
      )}

      {/* Open with 0 applicants diagnostic */}
      {isOpen && applicantCount === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Posted {getTimeSincePosted(shift.createdAt)} &middot; Visible to
                workers in {shift.location}. No applicants yet.
              </p>
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                  Tips to attract applicants:
                </p>
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-700">
                    Try increasing the pay rate -- competitive rates fill faster.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-700">
                    Add more details in the notes section to help workers understand the role.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shift Header */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        <div
          className={`h-2 ${STATUS_COLOR[shift.status] ?? "bg-gray-400"}`}
        />
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${ROLE_BADGE_COLOR[shift.role] ?? "bg-gray-100 text-gray-700"}`}
                >
                  {shift.role}
                </span>
                <StatusBadge
                  status={shift.status === "OPEN" ? "MATCHING" : shift.status}
                  variant="full"
                  showSublabel
                />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {shift.title || `${ROLE_LABELS[shift.role] ?? shift.role} Shift`}
              </h1>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <p className="text-3xl font-bold text-gray-900">
                ${parseFloat(String(shift.payRate)).toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">per hour</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4.5 w-4.5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium text-gray-900">{shift.location}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-4.5 w-4.5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium text-gray-900">
                  {dateFormatter.format(new Date(shift.startTime))}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                <Clock className="h-4.5 w-4.5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="font-medium text-gray-900">
                  {timeFormatter.format(new Date(shift.startTime))} -{" "}
                  {timeFormatter.format(new Date(shift.endTime))}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-4.5 w-4.5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pay Rate</p>
                <p className="font-medium text-gray-900">
                  ${parseFloat(String(shift.payRate)).toFixed(2)}/hr
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                <Briefcase className="h-4.5 w-4.5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <StatusBadge
                  status={shift.status === "OPEN" ? "MATCHING" : shift.status}
                  variant="pill"
                  className="mt-0.5"
                />
              </div>
            </div>

            {!isAssigned && shift.assignedWorker && (
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Users className="h-4.5 w-4.5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Assigned Worker</p>
                  <p className="font-medium text-blue-600">
                    {shift.assignedWorker.name}
                  </p>
                </div>
              </div>
            )}
          </div>

          {shift.notes && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-2">Notes</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {shift.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Actions - Prominent, full-width */}
      {(shift.status === "OPEN" || shift.status === "ASSIGNED") && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <ShiftActions
            shiftId={shift.id}
            status={shift.status}
            isAssigned={isAssigned}
          />
        </div>
      )}

      {/* Assignments / Applicants */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">
            Applicants & Assignments
          </h2>
          <span className="text-sm text-gray-400">
            {shift.assignments.length} total
          </span>
        </div>

        {shift.assignments.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center mb-3">
              <Users className="h-5 w-5 text-gray-300" />
            </div>
            <p className="text-sm text-gray-500">
              No applicants yet. Workers will appear here once they apply.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {shift.assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center border border-gray-200">
                    <span className="text-sm font-semibold text-gray-600">
                      {assignment.workerProfile.user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {assignment.workerProfile.user.name}
                    </p>
                    {assignment.workerProfile.credentials.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Shield className="h-3 w-3 text-emerald-500" />
                        <p className="text-xs text-gray-500">
                          {assignment.workerProfile.credentials
                            .map((c) => c.name)
                            .join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${ASSIGNMENT_STATUS_BADGE[assignment.status] ?? "bg-gray-100 text-gray-800"}`}
                >
                  {assignment.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* What happens next */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            What happens next
          </h2>
        </div>
        {isOpen && (
          <p className="text-sm text-gray-600 leading-relaxed">
            Workers are being notified. You&apos;ll see applicants appear here as they express interest in your shift.
          </p>
        )}
        {isAssigned && (
          <p className="text-sm text-gray-600 leading-relaxed">
            Your worker is confirmed. Mark the shift as complete after it has been fulfilled.
          </p>
        )}
        {isCompleted && (
          <p className="text-sm text-gray-600 leading-relaxed">
            Shift finished. Payment will be processed.
          </p>
        )}
        {isCancelled && (
          <p className="text-sm text-gray-600 leading-relaxed">
            This shift has been cancelled. No further action is needed.
          </p>
        )}
        {!isOpen && !isAssigned && !isCompleted && !isCancelled && (
          <p className="text-sm text-gray-600 leading-relaxed">
            Your shift is being processed. Check back for updates.
          </p>
        )}
      </div>
    </div>
  );
}
