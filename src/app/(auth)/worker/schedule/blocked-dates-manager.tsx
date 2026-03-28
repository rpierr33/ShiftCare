"use client";

import { useState, useTransition } from "react";
import { blockDates, unblockDate } from "@/actions/availability";
import { X, Plus, Loader2, Ban } from "lucide-react";

interface BlockedDateEntry {
  id: string;
  date: string;
  reason: string | null;
}

export function BlockedDatesManager({
  initialBlockedDates,
}: {
  initialBlockedDates: BlockedDateEntry[];
}) {
  const [blockedDates, setBlockedDates] = useState(initialBlockedDates);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBlocking, startBlocking] = useTransition();
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const [, startUnblocking] = useTransition();

  function handleBlock() {
    setError(null);

    if (!startDate) {
      setError("Please select a start date.");
      return;
    }

    // Build date range
    const dates: { date: string; reason?: string }[] = [];
    const end = endDate || startDate;

    const start = new Date(startDate + "T00:00:00");
    const endD = new Date(end + "T00:00:00");

    if (endD < start) {
      setError("End date must be on or after start date.");
      return;
    }

    const diffDays =
      Math.floor(
        (endD.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

    if (diffDays > 90) {
      setError("Cannot block more than 90 days at once.");
      return;
    }

    for (let i = 0; i < diffDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      dates.push({ date: dateStr, reason: reason.trim() || undefined });
    }

    startBlocking(async () => {
      const result = await blockDates(dates);
      if (result.success) {
        // Merge new dates into state
        const existingSet = new Set(blockedDates.map((d) => d.date));
        const newDates: BlockedDateEntry[] = dates
          .filter((d) => !existingSet.has(d.date))
          .map((d) => ({
            id: `temp-${d.date}`,
            date: d.date,
            reason: d.reason || null,
          }));
        // Also update existing dates with new reason
        const updated = blockedDates.map((bd) => {
          const match = dates.find((d) => d.date === bd.date);
          if (match) return { ...bd, reason: match.reason || null };
          return bd;
        });
        setBlockedDates([...updated, ...newDates].sort((a, b) => a.date.localeCompare(b.date)));
        setStartDate("");
        setEndDate("");
        setReason("");
      } else {
        setError(result.error || "Failed to block dates.");
      }
    });
  }

  function handleUnblock(dateId: string) {
    setUnblockingId(dateId);
    startUnblocking(async () => {
      const result = await unblockDate(dateId);
      if (result.success) {
        setBlockedDates((prev) => prev.filter((d) => d.id !== dateId));
      } else {
        setError(result.error || "Failed to unblock date.");
      }
      setUnblockingId(null);
    });
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d);
  }

  // Only show future blocked dates
  const today = new Date().toISOString().split("T")[0];
  const futureBlocked = blockedDates.filter((d) => d.date >= today);

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Ban className="h-5 w-5 text-red-500" />
        <h2 className="text-base font-semibold text-gray-900">
          Block Dates
        </h2>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Mark specific dates as unavailable. Shifts on blocked dates will not
        appear in your feed.
      </p>

      {/* Block dates form */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={today}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            End Date{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || today}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Reason{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Vacation, Appointment"
            className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 w-48 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>
        <button
          type="button"
          onClick={handleBlock}
          disabled={isBlocking}
          className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isBlocking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Block
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* List of blocked dates */}
      {futureBlocked.length > 0 ? (
        <div className="border border-gray-100 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
          {futureBlocked.map((bd) => (
            <div
              key={bd.id}
              className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {formatDate(bd.date)}
                  </p>
                  {bd.reason && (
                    <p className="text-xs text-gray-500">{bd.reason}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleUnblock(bd.id)}
                disabled={unblockingId === bd.id}
                className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                title="Unblock this date"
              >
                {unblockingId === bd.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic">No dates blocked.</p>
      )}
    </div>
  );
}
