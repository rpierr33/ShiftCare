export const dynamic = "force-dynamic";

import { getSessionUser } from "@/lib/auth-utils";
import { getWeeklyAvailability, getBlockedDates, getWorkerShiftsForCalendar } from "@/actions/availability";
import { getWorkerShifts } from "@/actions/shifts";
import { WeeklyAvailabilityEditor } from "./weekly-availability-editor";
import { CalendarView } from "./calendar-view";
import { BlockedDatesManager } from "./blocked-dates-manager";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  RN: "RN",
  LPN: "LPN",
  CNA: "CNA",
  HHA: "HHA",
  MEDICAL_ASSISTANT: "Med Asst",
  COMPANION: "Companion",
  OTHER: "Other",
};

function formatShiftTime(start: Date, end: Date): string {
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
  return `${startTime} - ${endTime}`;
}

export default async function SchedulePage() {
  await getSessionUser();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const [availability, blockedDates, calendarShifts, allShifts] =
    await Promise.all([
      getWeeklyAvailability(),
      getBlockedDates(),
      getWorkerShiftsForCalendar(currentYear, currentMonth),
      getWorkerShifts(),
    ]);

  // Upcoming shifts (next 5)
  const upcomingShifts = allShifts
    .filter(
      (s) =>
        new Date(s.startTime) > now &&
        s.status !== "CANCELLED"
    )
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
        <p className="mt-1 text-sm text-gray-500">
          Set your availability and manage your calendar.
        </p>
      </div>

      {/* Section 1: Weekly Availability */}
      <section>
        <WeeklyAvailabilityEditor initialSlots={availability} />
      </section>

      {/* Section 2: Calendar View */}
      <section>
        <CalendarView
          initialShifts={calendarShifts}
          initialBlockedDates={blockedDates}
          initialYear={currentYear}
          initialMonth={currentMonth}
        />
      </section>

      {/* Block Dates Manager */}
      <section>
        <BlockedDatesManager initialBlockedDates={blockedDates} />
      </section>

      {/* Section 3: Upcoming Shifts */}
      <section className="rounded-xl border border-gray-100 bg-white shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-cyan-600" />
          <h2 className="text-base font-semibold text-gray-900">
            Upcoming Shifts
          </h2>
        </div>

        {upcomingShifts.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500 mb-3">
              No upcoming shifts scheduled.
            </p>
            <Link
              href="/worker/shifts"
              className="inline-flex items-center gap-1 text-sm font-medium text-cyan-600 hover:text-cyan-700 transition-colors"
            >
              Browse available shifts
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {upcomingShifts.map((shift) => {
              const start = new Date(shift.startTime);
              const end = new Date(shift.endTime);
              const companyName =
                shift.provider?.providerProfile?.companyName ||
                shift.provider?.name ||
                "Provider";
              const roleLabel =
                ROLE_LABELS[shift.role] || shift.role;
              const dateStr = new Intl.DateTimeFormat("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              }).format(start);

              return (
                <Link
                  key={shift.id}
                  href={`/worker/shifts/${shift.id}`}
                  className="flex items-center gap-4 py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="flex-shrink-0 w-14 text-center">
                    <p className="text-xs font-medium text-gray-500 uppercase">
                      {dateStr.split(",")[0]}
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {start.getDate()}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-cyan-700">
                        {roleLabel}
                      </span>
                      <span className="text-sm text-gray-500 truncate">
                        {companyName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatShiftTime(start, end)}
                      </span>
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3" />
                        {shift.location}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
