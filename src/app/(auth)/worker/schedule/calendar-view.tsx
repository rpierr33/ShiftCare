"use client";

import { useState, useTransition } from "react";
import { getWorkerShiftsForCalendar } from "@/actions/availability";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import Link from "next/link";

const ROLE_LABELS: Record<string, string> = {
  RN: "RN",
  LPN: "LPN",
  CNA: "CNA",
  HHA: "HHA",
  MEDICAL_ASSISTANT: "MA",
  COMPANION: "Comp",
  OTHER: "Other",
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface ShiftEntry {
  id: string;
  role: string;
  startTime: string;
  endTime: string;
  status: string;
  location: string;
  providerName: string;
}

interface BlockedDateEntry {
  id: string;
  date: string;
  reason: string | null;
}

export function CalendarView({
  initialShifts,
  initialBlockedDates,
  initialYear,
  initialMonth,
}: {
  initialShifts: ShiftEntry[];
  initialBlockedDates: BlockedDateEntry[];
  initialYear: number;
  initialMonth: number;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [shifts, setShifts] = useState(initialShifts);
  const [isPending, startTransition] = useTransition();

  const blockedDates = initialBlockedDates;

  // Build lookup maps
  const shiftsByDate = new Map<string, ShiftEntry[]>();
  for (const shift of shifts) {
    const dateKey = new Date(shift.startTime).toISOString().split("T")[0];
    if (!shiftsByDate.has(dateKey)) shiftsByDate.set(dateKey, []);
    shiftsByDate.get(dateKey)!.push(shift);
  }

  const blockedByDate = new Map<string, BlockedDateEntry>();
  for (const bd of blockedDates) {
    blockedByDate.set(bd.date, bd);
  }

  // Calendar grid computation
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
  const daysInMonth = lastDay.getDate();

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Generate calendar cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function navigateMonth(direction: -1 | 1) {
    let newMonth = month + direction;
    let newYear = year;
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    setMonth(newMonth);
    setYear(newYear);

    startTransition(async () => {
      const newShifts = await getWorkerShiftsForCalendar(newYear, newMonth);
      setShifts(newShifts);
    });
  }

  function getDateKey(day: number): string {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function formatTime(iso: string): string {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(iso));
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-cyan-600" />
          <h2 className="text-base font-semibold text-gray-900">
            Monthly Calendar
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigateMonth(-1)}
            disabled={isPending}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 disabled:opacity-50 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-gray-900 min-w-[140px] text-center">
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            type="button"
            onClick={() => navigateMonth(1)}
            disabled={isPending}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 disabled:opacity-50 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-300" />
          Shift scheduled
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-100 border border-red-300" />
          Blocked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-cyan-100 border border-cyan-300" />
          Today
        </span>
      </div>

      {/* Loading overlay */}
      <div className={`relative ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="text-center text-xs font-semibold text-gray-400 py-2"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
          {cells.map((day, i) => {
            if (day === null) {
              return (
                <div key={`empty-${i}`} className="bg-gray-50 min-h-[72px] md:min-h-[88px]" />
              );
            }

            const dateKey = getDateKey(day);
            const dayShifts = shiftsByDate.get(dateKey) || [];
            const blocked = blockedByDate.get(dateKey);
            const isToday = dateKey === todayKey;

            let bgClass = "bg-white";
            if (blocked) bgClass = "bg-red-50";
            else if (dayShifts.length > 0) bgClass = "bg-emerald-50";

            return (
              <div
                key={dateKey}
                className={`${bgClass} min-h-[72px] md:min-h-[88px] p-1.5 relative transition-colors`}
              >
                <span
                  className={`text-xs font-medium ${
                    isToday
                      ? "bg-cyan-600 text-white w-6 h-6 rounded-full flex items-center justify-center"
                      : "text-gray-700"
                  }`}
                >
                  {day}
                </span>

                {/* Shifts on this day */}
                <div className="mt-1 space-y-0.5">
                  {dayShifts.slice(0, 2).map((shift) => (
                    <Link
                      key={shift.id}
                      href={`/worker/shifts/${shift.id}`}
                      className="block rounded px-1 py-0.5 text-[10px] leading-tight bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors truncate"
                      title={`${ROLE_LABELS[shift.role] || shift.role} ${formatTime(shift.startTime)}`}
                    >
                      <span className="font-semibold">{ROLE_LABELS[shift.role] || shift.role}</span>{" "}
                      <span className="hidden md:inline">{formatTime(shift.startTime)}</span>
                    </Link>
                  ))}
                  {dayShifts.length > 2 && (
                    <span className="block text-[10px] text-emerald-600 font-medium px-1">
                      +{dayShifts.length - 2} more
                    </span>
                  )}
                </div>

                {/* Blocked indicator */}
                {blocked && dayShifts.length === 0 && (
                  <div className="mt-1">
                    <span
                      className="block rounded px-1 py-0.5 text-[10px] leading-tight bg-red-100 text-red-700 truncate"
                      title={blocked.reason || "Blocked"}
                    >
                      {blocked.reason || "Blocked"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
