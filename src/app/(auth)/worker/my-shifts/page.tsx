export const dynamic = "force-dynamic";

import Link from "next/link";
import { getWorkerShifts } from "@/actions/shifts";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import {
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  ArrowRight,
  Briefcase,
  Clock,
  TrendingUp,
  BadgeDollarSign,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";
import { ClockInBanner } from "./clock-in-banner";
import { ClockOutBanner } from "./clock-out-banner";
import { CancelShiftButton } from "./cancel-shift-button";
import { RatingPrompt } from "@/components/shared/rating-prompt";
import { StarDisplay } from "@/components/shared/star-display";
import { formatShiftDateTime as formatShiftDateTimeTz, formatTime as formatTimeTz, getTimezoneLabel } from "@/lib/timezone";

// Removed: inline formatShiftDateTime — now using timezone-aware version from @/lib/timezone

function getHours(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

function formatCountdown(start: Date): string {
  const now = new Date();
  const diffMs = start.getTime() - now.getTime();
  if (diffMs <= 0) return "Starting now";
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  const remainingHours = diffHours % 24;
  if (diffDays > 0) {
    return `In ${diffDays}d ${remainingHours}h`;
  }
  if (diffHours > 0) {
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `In ${diffHours}h ${diffMinutes}m`;
  }
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  return `In ${diffMinutes}m`;
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

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: "check" | "x" | null }> = {
  ASSIGNED: { bg: "bg-blue-100", text: "text-blue-700", label: "Assigned", icon: null },
  COMPLETED: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Completed", icon: "check" },
  CANCELLED: { bg: "bg-red-100", text: "text-red-700", label: "Cancelled", icon: "x" },
};

type ShiftData = {
  id: string;
  role: string;
  title: string | null;
  location: string;
  startTime: Date;
  endTime: Date;
  payRate: number | { toString(): string };
  status: string;
  notes: string | null;
  providerId: string;
  provider: {
    name: string | null;
    providerProfile: { companyName: string | null } | null;
  } | null;
  timeEntries?: {
    id: string;
    clockInTime: Date;
    clockInStatus: string;
    distanceMiles: number | null;
    clockOutTime: Date | null;
    actualHours: number | null;
  }[];
};

export default async function MyShiftsPage() {
  const user = await getSessionUser();
  const userRecord = await db.user.findUnique({
    where: { id: user.id },
    select: { timezone: true },
  });
  const tz = userRecord?.timezone || null;
  const tzLabel = getTimezoneLabel(tz);

  const shifts = await getWorkerShifts();

  // Query which shifts the worker has already rated
  const userRatings = await db.rating.findMany({
    where: { raterId: user.id },
    select: { shiftId: true },
  });
  const ratedShiftIds = new Set(userRatings.map((r) => r.shiftId));

  // Query employer ratings for all providers in this shift list
  const providerIds = [...new Set(shifts.map((s) => s.providerId))];
  const providerRatings = providerIds.length > 0
    ? await db.rating.groupBy({
        by: ["rateeId"],
        where: { rateeId: { in: providerIds } },
        _avg: { score: true },
        _count: true,
      })
    : [];
  const providerRatingsMap = new Map(
    providerRatings.map((r) => [r.rateeId, { average: r._avg.score ?? 0, count: r._count }])
  );

  const now = new Date();
  // Categorize by STATUS first, then by time
  // COMPLETED and CANCELLED always go to Past regardless of time
  // IN_PROGRESS always goes to In Progress
  // ASSIGNED: check time to determine Upcoming vs In Progress
  const inProgress = shifts.filter((s) => {
    if (s.status === "COMPLETED" || s.status === "CANCELLED") return false;
    if (s.status === "IN_PROGRESS") return true;
    // ASSIGNED: started but not ended
    return new Date(s.startTime) <= now && new Date(s.endTime) > now;
  });
  const inProgressIds = new Set(inProgress.map((s) => s.id));
  const upcoming = shifts.filter((s) => {
    if (s.status === "COMPLETED" || s.status === "CANCELLED") return false;
    if (s.status === "IN_PROGRESS") return false;
    if (inProgressIds.has(s.id)) return false;
    return new Date(s.startTime) > now;
  });
  const upcomingIds = new Set(upcoming.map((s) => s.id));
  // Past: COMPLETED, CANCELLED, or anything not in the above categories
  const past = shifts.filter(
    (s) => !inProgressIds.has(s.id) && !upcomingIds.has(s.id)
  );

  // Earnings calculation: only completed shifts
  const completedShifts = shifts.filter((s) => s.status === "COMPLETED");
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const completedThisMonth = completedShifts.filter((s) => {
    const d = new Date(s.startTime);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  let monthlyEarnings = 0;
  for (const s of completedThisMonth) {
    const hours = getHours(new Date(s.startTime), new Date(s.endTime));
    const rate = parseFloat(String(s.payRate));
    monthlyEarnings += hours * rate;
  }

  // Next upcoming shift (soonest assigned)
  const nextShift = upcoming.length > 0
    ? upcoming.reduce((closest, s) => {
        const sTime = new Date(s.startTime).getTime();
        const cTime = new Date(closest.startTime).getTime();
        return sTime < cTime ? s : closest;
      }, upcoming[0])
    : null;

  // Find shifts that need clock-in: ASSIGNED, start time within 15min window, not yet clocked in
  const clockInEligible = shifts.filter((s) => {
    if (s.status !== "ASSIGNED") return false;
    const start = new Date(s.startTime);
    const end = new Date(s.endTime);
    const earlyWindow = new Date(start);
    earlyWindow.setMinutes(earlyWindow.getMinutes() - 15);
    const hasClockedIn = s.timeEntries && s.timeEntries.length > 0;
    return !hasClockedIn && now >= earlyWindow && now <= end;
  });

  // Find shifts that need clock-out: IN_PROGRESS, clocked in, NOT clocked out, shift hasn't ended yet
  const clockOutEligible = shifts.filter((s) => {
    if (s.status !== "IN_PROGRESS") return false;
    const hasClockedIn = s.timeEntries && s.timeEntries.length > 0;
    const hasClockedOut = hasClockedIn && s.timeEntries![0].clockOutTime;
    return hasClockedIn && !hasClockedOut && new Date(s.endTime) > now;
  });

  // Find shifts where worker forgot to clock out: IN_PROGRESS, clocked in, NOT clocked out, shift endTime has passed
  const missedClockOut = shifts.filter((s) => {
    if (s.status !== "IN_PROGRESS") return false;
    const hasClockedIn = s.timeEntries && s.timeEntries.length > 0;
    const hasClockedOut = hasClockedIn && s.timeEntries![0].clockOutTime;
    return hasClockedIn && !hasClockedOut && new Date(s.endTime) <= now;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Shifts</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your accepted and completed shifts.
        </p>
      </div>

      {/* CLOCK-IN BANNER — Big, bold, unmissable */}
      {clockInEligible.map((shift) => (
        <ClockInBanner
          key={shift.id}
          shiftId={shift.id}
          shiftTitle={shift.title || `${ROLE_LABELS[shift.role] || shift.role} Shift`}
          location={shift.location}
          startTime={new Date(shift.startTime).toISOString()}
          endTime={new Date(shift.endTime).toISOString()}
          providerName={
            shift.provider?.providerProfile?.companyName ||
            shift.provider?.name ||
            "Provider"
          }
        />
      ))}

      {/* CLOCK-OUT BANNER — For shifts that are in progress */}
      {clockOutEligible.map((shift) => (
        <ClockOutBanner
          key={`clockout-${shift.id}`}
          shiftId={shift.id}
          shiftTitle={shift.title || `${ROLE_LABELS[shift.role] || shift.role} Shift`}
          location={shift.location}
          startTime={new Date(shift.startTime).toISOString()}
          endTime={new Date(shift.endTime).toISOString()}
          providerName={
            shift.provider?.providerProfile?.companyName ||
            shift.provider?.name ||
            "Provider"
          }
          clockInTime={shift.timeEntries![0].clockInTime.toISOString()}
        />
      ))}

      {/* MISSED CLOCK-OUT WARNING — Shift ended but worker never clocked out */}
      {missedClockOut.map((shift) => (
        <div
          key={`missed-clockout-${shift.id}`}
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Missed Clock-Out: {shift.title || `${ROLE_LABELS[shift.role] || shift.role} Shift`}
              </p>
              <p className="mt-1 text-sm text-amber-700">
                You didn&apos;t clock out for this shift. The scheduled end time will be used as
                your clock-out. If you worked different hours, contact support.
              </p>
              <p className="mt-1.5 text-xs text-amber-600">
                Shift ended{" "}
                {formatShiftDateTimeTz(new Date(shift.startTime), new Date(shift.endTime), tz)}
                {tzLabel && ` ${tzLabel}`}
              </p>
            </div>
          </div>
        </div>
      ))}

      {shifts.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm py-16 px-6 text-center">
          <ClipboardList className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-800 font-semibold text-lg mb-2">
            No shifts yet
          </p>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-6 leading-relaxed">
            New shifts are posted daily — most fill within 30 minutes. Workers
            who accept quickly earn 40% more per month.
          </p>
          <Link
            href="/worker/shifts"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-cyan-600/20 hover:bg-cyan-700 transition-all duration-200"
          >
            Browse Available Shifts
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          {/* Earnings Summary Card */}
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <h2 className="text-base font-semibold text-gray-900">Earnings This Month</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-3xl font-bold text-emerald-600">
                  ${monthlyEarnings.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Gross earnings</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {completedThisMonth.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Shift{completedThisMonth.length === 1 ? "" : "s"} completed
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">
                  {upcoming.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Upcoming shift{upcoming.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-400">
              Before platform fee. <Link href="/worker/earnings" className="text-indigo-600 underline">View net earnings</Link>
            </p>
          </div>

          {/* In Progress Shifts */}
          {inProgress.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                In Progress
                <span className="text-sm font-normal text-gray-500">
                  ({inProgress.length})
                </span>
              </h2>
              <div className="space-y-3">
                {inProgress.map((shift) => (
                  <ShiftCard key={shift.id} shift={shift} variant="active" providerRating={providerRatingsMap.get(shift.providerId)} timezone={tz} tzLabel={tzLabel} />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming Shifts */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Upcoming
              {upcoming.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({upcoming.length})
                </span>
              )}
            </h2>

            {upcoming.length === 0 ? (
              <div className="rounded-xl border border-gray-100 bg-white shadow-sm py-8 text-center">
                <p className="text-sm text-gray-500 mb-3">No upcoming shifts.</p>
                <Link
                  href="/worker/shifts"
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Find shifts to accept
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((shift) => (
                  <ShiftCard
                    key={shift.id}
                    shift={shift}
                    variant="upcoming"
                    showCancel={shift.status === "ASSIGNED"}
                    providerRating={providerRatingsMap.get(shift.providerId)}
                    timezone={tz}
                    tzLabel={tzLabel}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Past Shifts */}
          {past.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Past
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({past.length})
                </span>
              </h2>
              <div className="space-y-3">
                {past.map((shift) => (
                  <ShiftCard
                    key={shift.id}
                    shift={shift}
                    variant="past"
                    hasRated={ratedShiftIds.has(shift.id)}
                    providerRating={providerRatingsMap.get(shift.providerId)}
                    timezone={tz}
                    tzLabel={tzLabel}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function NextShiftCard({ shift, timezone, tzLabel }: { shift: ShiftData; timezone: string | null; tzLabel: string }) {
  const companyName =
    shift.provider?.providerProfile?.companyName ||
    shift.provider?.name ||
    "Unknown Provider";
  const countdown = formatCountdown(new Date(shift.startTime));

  const hasClockedIn = shift.timeEntries && shift.timeEntries.length > 0;

  return (
    <div className="relative rounded-xl p-[2px] overflow-hidden">
      {/* Animated gradient border */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 bg-[length:200%_100%] animate-gradient rounded-xl" />
      {/* Card content */}
      <div className="relative rounded-[10px] bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-semibold text-blue-900">Next Shift</h2>
          </div>
          <div className="flex items-center gap-2">
            {hasClockedIn && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle className="h-3 w-3" />
                Clocked In
              </span>
            )}
            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
              {countdown}
            </span>
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-gray-800">{companyName}</p>
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span>{shift.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span>
              {formatShiftDateTimeTz(new Date(shift.startTime), new Date(shift.endTime), timezone)}
              {tzLabel && <span className="text-gray-400 ml-1">{tzLabel}</span>}
            </span>
          </div>
          <p className="text-lg font-bold text-emerald-600 pt-1">
            ${parseFloat(String(shift.payRate)).toFixed(2)}
            <span className="text-sm font-medium text-gray-500">/hr</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function ShiftCard({ shift, variant, showCancel, hasRated, providerRating, timezone, tzLabel }: { shift: ShiftData; variant: "upcoming" | "past" | "active"; showCancel?: boolean; hasRated?: boolean; providerRating?: { average: number; count: number }; timezone: string | null; tzLabel: string }) {
  const companyName =
    shift.provider?.providerProfile?.companyName ||
    shift.provider?.name ||
    "Unknown Provider";
  const roleColor = ROLE_COLORS[shift.role] || ROLE_COLORS.OTHER;
  const roleLabel = ROLE_LABELS[shift.role] || shift.role;
  const statusConfig = STATUS_CONFIG[shift.status] || {
    bg: "bg-gray-100",
    text: "text-gray-700",
    label: shift.status,
    icon: null,
  };

  const isCompleted = shift.status === "COMPLETED";
  const isPast = new Date(shift.startTime) < new Date();
  const hours = getHours(new Date(shift.startTime), new Date(shift.endTime));
  const rate = parseFloat(String(shift.payRate));
  const totalEarned = hours * rate;

  const hasClockedIn = shift.timeEntries && shift.timeEntries.length > 0;
  const clockInEntry = hasClockedIn ? shift.timeEntries![0] : null;

  const borderColor = variant === "active" ? "border-l-cyan-500" : variant === "upcoming" ? "border-l-emerald-500" : "border-l-gray-300";
  const cardOpacity = shift.status === "CANCELLED" ? "opacity-60" : "";

  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 shadow-sm border-l-4 ${borderColor} p-5 transition-all duration-200 hover:shadow-md ${cardOpacity}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        {/* Left side: details */}
        <div className="flex-1 space-y-2">
          {/* Role + Status badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${roleColor.bg} ${roleColor.text}`}>
              {roleLabel}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
              {statusConfig.icon === "check" && <CheckCircle className="h-3 w-3" />}
              {statusConfig.icon === "x" && <XCircle className="h-3 w-3" />}
              {statusConfig.label}
            </span>
            {hasClockedIn && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                clockInEntry?.clockInStatus === "ON_SITE"
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  : clockInEntry?.clockInStatus === "OFF_SITE"
                  ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                  : "bg-gray-50 text-gray-600 ring-1 ring-gray-200"
              }`}>
                <CheckCircle className="h-3 w-3" />
                Clocked In{clockInEntry?.clockInStatus === "OFF_SITE" ? " (Off-site)" : ""}
              </span>
            )}
            {/* Payment processed badge for completed past shifts */}
            {isCompleted && isPast && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600 ring-1 ring-emerald-200">
                <BadgeDollarSign className="h-3 w-3" />
                Payment processed
              </span>
            )}
          </div>

          {/* Provider */}
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-500">{companyName}</p>
            {providerRating && providerRating.count > 0 && (
              <StarDisplay average={providerRating.average} count={providerRating.count} />
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span>{shift.location}</span>
          </div>

          {/* Date/Time */}
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span>
              {formatShiftDateTimeTz(new Date(shift.startTime), new Date(shift.endTime), timezone)}
              {tzLabel && <span className="text-gray-400 ml-1">{tzLabel}</span>}
            </span>
          </div>
        </div>

        {/* Right side: pay + earned */}
        <div className="sm:text-right space-y-1">
          <p className="text-2xl font-bold text-emerald-600">
            ${rate.toFixed(2)}
            <span className="text-sm font-medium text-gray-500">/hr</span>
          </p>
          {isCompleted && (
            <div className="flex items-center gap-1.5 sm:justify-end">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <p className="text-sm font-semibold text-emerald-700">
                ${totalEarned.toFixed(2)} earned
              </p>
            </div>
          )}
          {isCompleted && (
            <p className="text-xs text-gray-400">
              {hours.toFixed(1)} hrs
            </p>
          )}
          {isCompleted && clockInEntry?.clockOutTime && (
            <div className="mt-1 space-y-0.5">
              <p className="text-xs text-gray-500">
                Clocked: {formatTimeTz(new Date(clockInEntry.clockInTime), timezone)}
                {" \u2013 "}
                {formatTimeTz(new Date(clockInEntry.clockOutTime), timezone)}
                {clockInEntry.actualHours != null && ` (${clockInEntry.actualHours.toFixed(1)} hrs)`}
              </p>
              {clockInEntry.actualHours != null && Math.abs(clockInEntry.actualHours - hours) > 0.1 && (
                <p className="text-xs font-medium text-amber-600">
                  Scheduled: {hours.toFixed(1)}h | Actual: {clockInEntry.actualHours.toFixed(1)}h
                </p>
              )}
            </div>
          )}
          {showCancel && (
            <CancelShiftButton shiftId={shift.id} shiftStartTime={new Date(shift.startTime).toISOString()} />
          )}
        </div>
      </div>
      {/* View Details link */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
        <Link
          href={`/worker/shifts/${shift.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-cyan-600 hover:text-cyan-700 transition-colors"
        >
          View Details
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {/* Rating prompt for completed, unrated shifts */}
      {isCompleted && hasRated === false && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <RatingPrompt
            shiftId={shift.id}
            rateeName={companyName}
            rateeRole="employer"
          />
        </div>
      )}
    </div>
  );
}
