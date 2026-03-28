"use client";

import { useState, useTransition } from "react";
import { setWeeklyAvailability } from "@/actions/availability";
import { Clock, Check, Loader2 } from "lucide-react";

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

const DAY_LABELS_FULL: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

interface Slot {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export function WeeklyAvailabilityEditor({
  initialSlots,
}: {
  initialSlots: Slot[];
}) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build initial state: map of day -> { enabled, startTime, endTime }
  const initialMap = new Map(
    initialSlots.map((s) => [s.dayOfWeek, { startTime: s.startTime, endTime: s.endTime }])
  );

  const [dayStates, setDayStates] = useState<
    Record<string, { enabled: boolean; startTime: string; endTime: string }>
  >(() => {
    const state: Record<
      string,
      { enabled: boolean; startTime: string; endTime: string }
    > = {};
    for (const day of DAYS) {
      const existing = initialMap.get(day);
      state[day] = {
        enabled: !!existing,
        startTime: existing?.startTime || "07:00",
        endTime: existing?.endTime || "19:00",
      };
    }
    return state;
  });

  function toggleDay(day: string) {
    setDayStates((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
    setSaved(false);
  }

  function updateTime(day: string, field: "startTime" | "endTime", value: string) {
    setDayStates((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    setSaved(false);

    const slots: Slot[] = [];
    for (const day of DAYS) {
      const state = dayStates[day];
      if (state.enabled) {
        if (state.startTime >= state.endTime) {
          setError(`${DAY_LABELS_FULL[day]}: Start time must be before end time.`);
          return;
        }
        slots.push({
          dayOfWeek: day,
          startTime: state.startTime,
          endTime: state.endTime,
        });
      }
    }

    startTransition(async () => {
      const result = await setWeeklyAvailability(slots);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(result.error || "Failed to save.");
      }
    });
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-cyan-600" />
          <h2 className="text-base font-semibold text-gray-900">
            Weekly Availability
          </h2>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Set your recurring weekly schedule. Only shifts matching your
        availability will appear in your feed.
      </p>

      <div className="space-y-3">
        {DAYS.map((day) => {
          const state = dayStates[day];
          return (
            <div
              key={day}
              className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                state.enabled
                  ? "border-cyan-200 bg-cyan-50/50"
                  : "border-gray-100 bg-gray-50/50"
              }`}
            >
              {/* Day toggle */}
              <button
                type="button"
                onClick={() => toggleDay(day)}
                className={`flex-shrink-0 w-16 py-1.5 rounded-md text-sm font-semibold text-center transition-colors ${
                  state.enabled
                    ? "bg-cyan-600 text-white"
                    : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                }`}
              >
                {DAY_LABELS[day]}
              </button>

              {state.enabled ? (
                <div className="flex items-center gap-2 flex-1 flex-wrap">
                  <input
                    type="time"
                    value={state.startTime}
                    onChange={(e) =>
                      updateTime(day, "startTime", e.target.value)
                    }
                    className="rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                  <span className="text-sm text-gray-400">to</span>
                  <input
                    type="time"
                    value={state.endTime}
                    onChange={(e) =>
                      updateTime(day, "endTime", e.target.value)
                    }
                    className="rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              ) : (
                <span className="text-sm text-gray-400 italic">
                  Not available
                </span>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check className="h-4 w-4" />
              Saved
            </>
          ) : (
            "Save Availability"
          )}
        </button>
        {saved && (
          <span className="text-sm text-emerald-600 font-medium">
            Availability updated successfully.
          </span>
        )}
      </div>
    </div>
  );
}
