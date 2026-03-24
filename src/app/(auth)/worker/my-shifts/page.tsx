import Link from "next/link";
import { getWorkerShifts } from "@/actions/shifts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  return `${dateStr} \u2022 ${startTime} \u2013 ${endTime}`;
}

const STATUS_STYLES: Record<string, { variant: "default" | "success" | "secondary" | "danger"; label: string }> = {
  OPEN: { variant: "success", label: "Open" },
  ASSIGNED: { variant: "default", label: "Assigned" },
  COMPLETED: { variant: "secondary", label: "Completed" },
  CANCELLED: { variant: "danger", label: "Cancelled" },
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Shifts</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your accepted and completed shifts.
        </p>
      </div>

      {shifts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <p className="text-gray-500">
              You haven&apos;t accepted any shifts yet. Browse available shifts to get started.
            </p>
            <Link
              href="/worker/shifts"
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Browse available shifts
              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </CardContent>
        </Card>
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
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-sm text-gray-500">No upcoming shifts.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((shift) => (
                  <ShiftCard key={shift.id} shift={shift} />
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {past.map((shift) => (
                  <ShiftCard key={shift.id} shift={shift} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ShiftCard({
  shift,
}: {
  shift: {
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
}) {
  const statusStyle = STATUS_STYLES[shift.status] || {
    variant: "secondary" as const,
    label: shift.status,
  };
  const companyName =
    shift.provider?.providerProfile?.companyName ||
    shift.provider?.name ||
    "Unknown Provider";

  return (
    <Card className={shift.status === "CANCELLED" ? "opacity-60" : ""}>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Badge variant={statusStyle.variant}>{statusStyle.label}</Badge>
          <span className="text-lg font-semibold text-gray-900 whitespace-nowrap">
            ${parseFloat(String(shift.payRate)).toFixed(2)}/hr
          </span>
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium text-gray-900">
            {ROLE_LABELS[shift.role] || shift.role}
          </p>
          {shift.title && (
            <p className="text-sm text-gray-700">{shift.title}</p>
          )}
          <p className="text-sm text-gray-600">{companyName}</p>
        </div>

        <div className="space-y-1.5 text-sm text-gray-500">
          <p className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            {shift.location}
          </p>
          <p className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatShiftDateTime(new Date(shift.startTime), new Date(shift.endTime))}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
