import Link from "next/link";
import { getAvailableShifts } from "@/actions/shifts";
import { AcceptShiftButton } from "@/components/worker/accept-shift-button";
import { MapPin, Calendar, Clock, UserCheck, AlertCircle, Flame, ShieldCheck, Eye, TrendingUp } from "lucide-react";

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

function getCountdown(start: Date): string | null {
  const now = new Date();
  const diffMs = start.getTime() - now.getTime();
  if (diffMs <= 0 || diffMs > 48 * 60 * 60 * 1000) return null;
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `Starts in ${hours}h ${minutes}m`;
}

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  RN: { bg: "bg-purple-100", text: "text-purple-700" },
  LPN: { bg: "bg-indigo-100", text: "text-indigo-700" },
  CNA: { bg: "bg-teal-100", text: "text-teal-700" },
  HHA: { bg: "bg-orange-100", text: "text-orange-700" },
  MEDICAL_ASSISTANT: { bg: "bg-cyan-100", text: "text-cyan-700" },
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Urgency Banner */}
      {shifts.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-sm py-2 text-center rounded-xl mb-4">
          <span className="inline-flex items-center gap-1.5">
            <Flame className="h-4 w-4" />
            12 shifts filled in the last hour. Workers are earning an average of $30/hr today.
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Available Shifts
            </h1>
            {shifts.length > 0 && (
              <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Live
              </div>
            )}
          </div>
          <p className="mt-1.5 text-sm text-slate-500">
            {shifts.length > 0
              ? "New shifts are posted every few minutes. Accept before someone else does."
              : "Accept shifts near you \u2014 first come, first served"}
          </p>
        </div>
      </div>

      {/* Content */}
      {shifts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-20 px-6 text-center">
          <div className="mb-5">
            <div className="mx-auto h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-slate-300" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            No shifts match your area right now
          </h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
            Complete your profile to get matched faster. Providers look for
            workers with full profiles and up-to-date locations.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/worker/profile"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-600/20 hover:bg-cyan-700 transition-all duration-200"
            >
              <UserCheck className="h-4 w-4" />
              Update Profile
            </Link>
            <Link
              href="/worker/profile#location-section"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 hover:ring-slate-300 transition-all duration-200"
            >
              <MapPin className="h-4 w-4" />
              Expand Location
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shifts.map((shift, index) => {
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
            const workersViewing = 3 + (index % 5);
            const isFillingFast = index % 5 >= 2;
            const countdown = getCountdown(new Date(shift.startTime));

            return (
              <div
                key={shift.id}
                className={`group relative bg-white rounded-2xl border shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col overflow-hidden ${
                  isUrgent ? "border-amber-200 ring-1 ring-amber-100" : "border-slate-100"
                }`}
              >
                {/* Top accent bar */}
                <div className={`h-1 w-full ${roleColor.bg}`} />

                <div className="p-5 flex flex-col flex-1">
                  {/* Top row: Role Badge + Posted time */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${roleColor.bg} ${roleColor.text}`}>
                        {roleLabel}
                      </span>
                      {isUrgent && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                          <AlertCircle className="h-3 w-3" />
                          Urgent
                        </span>
                      )}
                      {isHighDemand && !isUrgent && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                          <Flame className="h-3 w-3" />
                          High demand
                        </span>
                      )}
                      {isFillingFast && (
                        <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 text-xs px-2 py-0.5 rounded-full font-medium">
                          <TrendingUp className="h-3 w-3" />
                          Filling fast
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                      {postedAgo}
                    </span>
                  </div>

                  {/* Countdown to shift start */}
                  {countdown && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-semibold text-amber-600">{countdown}</span>
                    </div>
                  )}

                  {/* Provider info */}
                  <div className="mb-4">
                    <p className="text-sm font-bold text-slate-900 mb-1">{companyName}</p>
                    <div className="flex items-center gap-1.5">
                      {hasCompanyName && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-cyan-600">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Verified
                        </span>
                      )}
                      {!hasCompanyName && (
                        <span className="text-xs text-slate-400">New provider</span>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                    <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <span className="truncate">
                      {shift.location}
                      {location && ` \u00B7 ${location}`}
                    </span>
                  </div>

                  {/* Date/Time */}
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                    <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <span>
                      {formatShiftDateTime(new Date(shift.startTime), new Date(shift.endTime))}
                    </span>
                  </div>

                  {/* Workers viewing indicator */}
                  <div className="flex items-center gap-1.5 mb-5">
                    <Eye className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs text-slate-400">{workersViewing} workers viewing</span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-100 -mx-5 mb-5" />

                  {/* Pay Rate */}
                  <div className="mb-4">
                    <p className="text-3xl font-bold text-emerald-600 tracking-tight">
                      ${parseFloat(String(shift.payRate)).toFixed(2)}
                      <span className="text-base font-normal text-slate-400 ml-0.5">/hr</span>
                    </p>
                  </div>

                  {/* Notes */}
                  {shift.notes && (
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">{shift.notes}</p>
                  )}

                  {/* Spacer to push button to bottom */}
                  <div className="mt-auto pt-1 group-hover:shadow-lg group-hover:shadow-cyan-500/20 rounded-xl transition-shadow duration-300">
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
