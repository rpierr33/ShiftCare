import { getAvailableShifts } from "@/actions/shifts";
import { AcceptShiftButton } from "@/components/worker/accept-shift-button";
import { MapPin, Calendar, Clock } from "lucide-react";

function formatShiftDateTime(start: Date, end: Date): string {
  const dateStr = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(start);

  const startTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(start);

  const endTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(end);

  return `${dateStr} \u00B7 ${startTime} \u2013 ${endTime}`;
}

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  RN: { bg: "bg-blue-100", text: "text-blue-700" },
  LPN: { bg: "bg-indigo-100", text: "text-indigo-700" },
  CNA: { bg: "bg-purple-100", text: "text-purple-700" },
  HHA: { bg: "bg-teal-100", text: "text-teal-700" },
  MEDICAL_ASSISTANT: { bg: "bg-amber-100", text: "text-amber-700" },
  COMPANION: { bg: "bg-pink-100", text: "text-pink-700" },
  OTHER: { bg: "bg-gray-100", text: "text-gray-700" },
};

const ROLE_LABELS: Record<string, string> = {
  RN: "RN",
  LPN: "LPN",
  CNA: "CNA",
  HHA: "HHA",
  MEDICAL_ASSISTANT: "Med Asst",
  COMPANION: "Companion",
  OTHER: "Other",
};

export default async function WorkerShiftsPage() {
  const shifts = await getAvailableShifts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Available Shifts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Accept shifts near you &mdash; first come, first served
          </p>
        </div>
        {shifts.length > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-600/10 whitespace-nowrap">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            {shifts.length} shift{shifts.length === 1 ? "" : "s"} available
          </div>
        )}
      </div>

      {/* Content */}
      {shifts.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm py-16 text-center">
          <div className="text-4xl mb-4">
            <Calendar className="h-12 w-12 mx-auto text-gray-300" />
          </div>
          <p className="text-gray-500 max-w-sm mx-auto">
            No open shifts right now. New shifts are posted daily &mdash; check back soon!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shifts.map((shift) => {
            const companyName =
              shift.provider?.providerProfile?.companyName ||
              shift.provider?.name ||
              "Unknown Provider";
            const location =
              shift.provider?.providerProfile?.city && shift.provider?.providerProfile?.state
                ? `${shift.provider.providerProfile.city}, ${shift.provider.providerProfile.state}`
                : null;
            const roleColor = ROLE_COLORS[shift.role] || ROLE_COLORS.OTHER;
            const roleLabel = ROLE_LABELS[shift.role] || shift.role;

            return (
              <div
                key={shift.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-5 flex flex-col"
              >
                {/* Role Badge */}
                <div className="mb-3">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${roleColor.bg} ${roleColor.text}`}>
                    {roleLabel}
                  </span>
                </div>

                {/* Provider */}
                <p className="text-sm text-gray-500 mb-2">{companyName}</p>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-1.5">
                  <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span>
                    {shift.location}
                    {location && ` \u00B7 ${location}`}
                  </span>
                </div>

                {/* Date/Time */}
                <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-4">
                  <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span>
                    {formatShiftDateTime(new Date(shift.startTime), new Date(shift.endTime))}
                  </span>
                </div>

                {/* Pay Rate */}
                <p className="text-2xl font-bold text-emerald-600 mb-3">
                  ${parseFloat(String(shift.payRate)).toFixed(2)}
                  <span className="text-sm font-medium text-gray-500">/hr</span>
                </p>

                {/* Notes */}
                {shift.notes && (
                  <p className="text-xs text-gray-400 line-clamp-2 mb-3">{shift.notes}</p>
                )}

                {/* Spacer to push button to bottom */}
                <div className="mt-auto pt-2">
                  <AcceptShiftButton shiftId={shift.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
