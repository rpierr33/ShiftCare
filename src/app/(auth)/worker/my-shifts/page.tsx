import Link from "next/link";
import { getWorkerShifts } from "@/actions/shifts";
import { MapPin, Calendar, CheckCircle, XCircle, ArrowRight, Briefcase } from "lucide-react";

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
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm py-16 text-center">
          <Briefcase className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">
            You haven&apos;t accepted any shifts yet.
          </p>
          <Link
            href="/worker/shifts"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-600/20 hover:bg-blue-500 transition-all duration-200"
          >
            Browse Available Shifts
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
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
                <p className="text-sm text-gray-500">No upcoming shifts.</p>
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

        {/* Right side: pay */}
        <div className="sm:text-right">
          <p className="text-2xl font-bold text-emerald-600">
            ${parseFloat(String(shift.payRate)).toFixed(2)}
            <span className="text-sm font-medium text-gray-500">/hr</span>
          </p>
        </div>
      </div>
    </div>
  );
}
