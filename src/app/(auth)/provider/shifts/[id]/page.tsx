import Link from "next/link";
import { notFound } from "next/navigation";
import { getShiftById } from "@/actions/shifts";
import { ShiftActions } from "./shift-actions";

const STATUS_BADGE: Record<string, string> = {
  OPEN: "bg-green-100 text-green-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  ASSIGNED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const ASSIGNMENT_STATUS_BADGE: Record<string, string> = {
  REQUESTED: "bg-yellow-100 text-yellow-800",
  HELD: "bg-purple-100 text-purple-800",
  ACCEPTED: "bg-green-100 text-green-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
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
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
      >
        &larr; Back to Dashboard
      </Link>

      {/* Shift Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {shift.title || `${shift.role} Shift`}
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${STATUS_BADGE[shift.status] ?? "bg-gray-100 text-gray-800"}`}
            >
              {shift.status}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${parseFloat(String(shift.payRate)).toFixed(2)}
            <span className="text-sm font-normal text-gray-500">/hr</span>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Role</p>
            <p className="font-medium text-gray-900">{shift.role}</p>
          </div>
          <div>
            <p className="text-gray-500">Location</p>
            <p className="font-medium text-gray-900">{shift.location}</p>
          </div>
          <div>
            <p className="text-gray-500">Date</p>
            <p className="font-medium text-gray-900">
              {dateFormatter.format(new Date(shift.startTime))}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Time</p>
            <p className="font-medium text-gray-900">
              {timeFormatter.format(new Date(shift.startTime))} -{" "}
              {timeFormatter.format(new Date(shift.endTime))}
            </p>
          </div>
        </div>

        {shift.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Notes</p>
            <p className="text-sm text-gray-700">{shift.notes}</p>
          </div>
        )}

        {shift.assignedWorker && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Assigned Worker</p>
            <p className="text-sm font-medium text-blue-600">{shift.assignedWorker.name}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      {(shift.status === "OPEN" || shift.status === "ASSIGNED") && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
          <ShiftActions shiftId={shift.id} status={shift.status} />
        </div>
      )}

      {/* Assignments / Applicants */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Applicants & Assignments ({shift.assignments.length})
        </h2>

        {shift.assignments.length === 0 ? (
          <p className="text-sm text-gray-500">No applicants yet.</p>
        ) : (
          <div className="space-y-3">
            {shift.assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between border border-gray-100 rounded-lg p-4"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {assignment.workerProfile.user.name}
                  </p>
                  {assignment.workerProfile.credentials.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {assignment.workerProfile.credentials
                        .map((c) => c.name)
                        .join(", ")}
                    </p>
                  )}
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ASSIGNMENT_STATUS_BADGE[assignment.status] ?? "bg-gray-100 text-gray-800"}`}
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
