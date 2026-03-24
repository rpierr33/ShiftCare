import Link from "next/link";
import { getProviderShifts } from "@/actions/shifts";
import { getSubscriptionStatus } from "@/actions/billing";

const STATUS_BADGE: Record<string, string> = {
  OPEN: "bg-green-100 text-green-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  ASSIGNED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default async function ProviderDashboardPage() {
  const [shifts, subscription] = await Promise.all([
    getProviderShifts(),
    getSubscriptionStatus(),
  ]);

  const totalShifts = shifts.length;
  const openShifts = shifts.filter((s) => s.status === "OPEN").length;
  const assignedShifts = shifts.filter((s) => s.status === "ASSIGNED").length;
  const planName = subscription?.plan ?? "FREE";
  const shiftsUsed = subscription?.usage?.shiftsPosted ?? 0;
  const shiftsLimit = subscription?.limits?.shiftsPerMonth ?? 3;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Provider Dashboard</h1>
        <Link
          href="/provider/shifts/new"
          className="inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Post New Shift
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Shifts</p>
          <p className="text-2xl font-bold text-gray-900">{totalShifts}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Open Shifts</p>
          <p className="text-2xl font-bold text-green-600">{openShifts}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Assigned Shifts</p>
          <p className="text-2xl font-bold text-blue-600">{assignedShifts}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Current Plan</p>
          <p className="text-2xl font-bold text-gray-900">{planName}</p>
        </div>
      </div>

      {/* Usage Indicator */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-8">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">{shiftsUsed}</span> of{" "}
            <span className="font-semibold">
              {shiftsLimit === Infinity ? "Unlimited" : shiftsLimit}
            </span>{" "}
            shifts used this month
          </p>
          {shiftsLimit !== Infinity && (
            <div className="w-48 bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min((shiftsUsed / shiftsLimit) * 100, 100)}%`,
                }}
              />
            </div>
          )}
        </div>
        {planName === "FREE" && (
          <Link
            href="/provider/billing"
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mt-2 inline-block"
          >
            Upgrade for more shifts
          </Link>
        )}
      </div>

      {/* Recent Shifts */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Shifts</h2>

      {shifts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">
            No shifts yet. Post your first shift to start filling positions.
          </p>
          <Link
            href="/provider/shifts/new"
            className="inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Post New Shift
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {shifts.map((shift) => (
            <Link
              key={shift.id}
              href={`/provider/shifts/${shift.id}`}
              className="block bg-white rounded-lg border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900">
                      {shift.title || `${shift.role} Shift`}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[shift.status] ?? "bg-gray-100 text-gray-800"}`}
                    >
                      {shift.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">
                    {shift.role} &middot; {shift.location}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(shift.startTime).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    &middot;{" "}
                    {new Date(shift.startTime).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {new Date(shift.endTime).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  {shift.assignedWorker && (
                    <p className="text-sm text-blue-600 mt-1">
                      Assigned to: {shift.assignedWorker.name}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    ${parseFloat(String(shift.payRate)).toFixed(2)}
                    <span className="text-sm font-normal text-gray-500">/hr</span>
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
