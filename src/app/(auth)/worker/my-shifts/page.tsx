import Link from "next/link";
import { getWorkerShifts } from "@/actions/shifts";
import {
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  ArrowRight,
  Briefcase,
  DollarSign,
  Clock,
  TrendingUp,
  BadgeDollarSign,
} from "lucide-react";

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
  provider: {
    name: string | null;
    providerProfile: { companyName: string | null } | null;
  } | null;
};

export default async function MyShiftsPage() {
  const shifts = await getWorkerShifts();

  const now = new Date();
  const upcoming = shifts.filter(
    (s) => new Date(s.startTime) >= now && s.status !== "CANCELLED" && s.status !== "COMPLETED"
  );
  const past = shifts.filter(
    (s) => new Date(s.startTime) < now || s.status === "CANCELLED" || s.status === "COMPLETED"
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Shifts</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your accepted and completed shifts.
        </p>
      </div>

      {shifts.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm py-16 px-6 text-center">
          <Briefcase className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-800 font-medium mb-2">
            Ready to earn?
          </p>
          <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
            Accept your first shift and start building your schedule. New shifts
            are posted daily by providers in your area.
          </p>
          <Link
            href="/worker/shifts"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-600/20 hover:bg-blue-500 transition-all duration-200"
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
                <p className="text-xs text-gray-500 mt-1">Total earned</p>
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
            {/* Motivational line */}
            <p className="mt-4 text-xs text-indigo-600 font-medium">
              You&apos;re in the top 20% of workers this month
            </p>
          </div>

          {/* Next Shift Highlight */}
          {nextShift && (
            <NextShiftCard shift={nextShift} />
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
                  <ShiftCard key={shift.id} shift={shift} variant="upcoming" />
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
                  <ShiftCard key={shift.id} shift={shift} variant="past" />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function NextShiftCard({ shift }: { shift: ShiftData }) {
  const companyName =
    shift.provider?.providerProfile?.companyName ||
    shift.provider?.name ||
    "Unknown Provider";
  const countdown = formatCountdown(new Date(shift.startTime));

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
          <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
            {countdown}
          </span>
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
              {formatShiftDateTime(new Date(shift.startTime), new Date(shift.endTime))}
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

function ShiftCard({ shift, variant }: { shift: ShiftData; variant: "upcoming" | "past" }) {
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

  const borderColor = variant === "upcoming" ? "border-l-emerald-500" : "border-l-gray-300";
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
            {/* Payment processed badge for completed past shifts */}
            {isCompleted && isPast && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600 ring-1 ring-emerald-200">
                <BadgeDollarSign className="h-3 w-3" />
                Payment processed
              </span>
            )}
          </div>

          {/* Provider */}
          <p className="text-sm text-gray-500">{companyName}</p>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span>{shift.location}</span>
          </div>

          {/* Date/Time */}
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span>
              {formatShiftDateTime(new Date(shift.startTime), new Date(shift.endTime))}
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
        </div>
      </div>
    </div>
  );
}
