import Link from "next/link";
import { getAvailableShifts } from "@/actions/shifts";
import { AcceptShiftButton } from "@/components/worker/accept-shift-button";
import { MapPin, Calendar, Clock, UserCheck, AlertCircle, Flame, ShieldCheck } from "lucide-react";

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

function formatStartTime(start: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(start);
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

function startsWithin24Hours(start: Date): boolean {
  const now = new Date();
  const diffMs = start.getTime() - now.getTime();
  return diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000;
}

function startsWithin48Hours(start: Date): boolean {
  const now = new Date();
  const diffMs = start.getTime() - now.getTime();
  return diffMs > 0 && diffMs <= 48 * 60 * 60 * 1000;
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
            {shifts.length} shift{shifts.length === 1 ? "" : "s"} available and counting
          </div>
        )}
      </div>

      {/* Content */}
      {shifts.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm py-16 px-6 text-center">
          <div className="mb-4">
            <Calendar className="h-12 w-12 mx-auto text-gray-300" />
          </div>
          <p className="text-gray-700 font-medium mb-2">
            No shifts match your area right now.
          </p>
          <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
            Complete your profile to get matched faster. Providers look for
            workers with full profiles and up-to-date locations.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/worker/profile"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-600/20 hover:bg-blue-500 transition-all duration-200"
            >
              <UserCheck className="h-4 w-4" />
              Update Profile
            </Link>
            <Link
              href="/worker/profile#location-section"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 transition-all duration-200"
            >
              <MapPin className="h-4 w-4" />
              Expand Location
            </Link>
          </div>
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
            const isUrgent = startsWithin24Hours(new Date(shift.startTime));
            const isHighDemand = startsWithin48Hours(new Date(shift.startTime));
            const postedAgo = timeAgo(new Date(shift.createdAt));
            const hasCompanyName = !!shift.provider?.providerProfile?.companyName;

            return (
              <div
                key={shift.id}
                className={`relative bg-white rounded-xl border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-5 flex flex-col ${
                  isUrgent ? "border-amber-200 ring-1 ring-amber-100" : "border-gray-100"
                }`}
              >
                {/* Top row: Role Badge + Urgency + Demand */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${roleColor.bg} ${roleColor.text}`}>
                      {roleLabel}
                    </span>
                    {isUrgent && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                        <AlertCircle className="h-3 w-3" />
                        Starts tomorrow!
                      </span>
                    )}
                    {isHighDemand && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
                        <Flame className="h-3 w-3" />
                        High demand
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    Posted {postedAgo}
                  </span>
                </div>

                {/* Provider — more prominent */}
                <p className="text-sm font-semibold text-gray-800 mb-1">{companyName}</p>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs text-gray-400">
                    {hasCompanyName ? "Verified provider" : "New provider"}
                  </p>
                  {hasCompanyName && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <ShieldCheck className="h-3 w-3" />
                      Verified agency
                    </span>
                  )}
                </div>

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

                {/* Pay Rate — most visually prominent */}
                <p className="text-3xl font-bold text-emerald-600 mb-3">
                  ${parseFloat(String(shift.payRate)).toFixed(2)}
                  <span className="text-sm font-medium text-gray-500">/hr</span>
                </p>

                {/* Notes */}
                {shift.notes && (
                  <p className="text-xs text-gray-400 line-clamp-2 mb-3">{shift.notes}</p>
                )}

                {/* Spacer to push button to bottom */}
                <div className="mt-auto pt-2 relative">
                  {/* Subtle pulse ring around button area for OPEN shifts */}
                  <div className="absolute -inset-1 rounded-xl bg-blue-400/10 animate-pulse-ring-slow pointer-events-none" />
                  <div className="relative">
                    <AcceptShiftButton
                      shiftId={shift.id}
                      location={shift.location}
                      startTime={formatStartTime(new Date(shift.startTime))}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
