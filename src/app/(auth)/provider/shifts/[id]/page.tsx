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
} from "lucide-react";
import { getShiftById } from "@/actions/shifts";
import { ShiftActions } from "./shift-actions";

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/provider/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Hero Header */}
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
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[shift.status] ?? "bg-gray-100 text-gray-800"}`}
                >
                  {shift.status}
                </span>
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
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-0.5 ${STATUS_BADGE[shift.status] ?? "bg-gray-100 text-gray-800"}`}
                >
                  {shift.status}
                </span>
              </div>
            </div>

            {shift.assignedWorker && (
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

      {/* Actions */}
      {(shift.status === "OPEN" || shift.status === "ASSIGNED") && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Actions
          </h2>
          <ShiftActions shiftId={shift.id} status={shift.status} />
        </div>
      )}

      {/* Assignments / Applicants */}
      <div className="bg-white rounded-xl shadow-sm p-6">
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
    </div>
  );
}
