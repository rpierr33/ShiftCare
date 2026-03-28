/**
 * Timezone-aware date/time formatting utilities.
 * All functions accept an optional timezone string (IANA format, e.g., "America/New_York").
 * Falls back to the runtime's default timezone if none is provided.
 */

// Core formatter — applies timezone to Intl.DateTimeFormat if provided
export function formatInTimezone(
  date: Date | string,
  timezone: string | null | undefined,
  options: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (timezone) {
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone: timezone }).format(d);
  }
  return new Intl.DateTimeFormat("en-US", options).format(d);
}

// Formats a shift's full date and time range: "Jan 1, 2026 · 3:00 PM – 11:00 PM"
export function formatShiftDateTime(
  start: Date | string,
  end: Date | string,
  timezone?: string | null
): string {
  const s = typeof start === "string" ? new Date(start) : start;
  const e = typeof end === "string" ? new Date(end) : end;

  const dateStr = formatInTimezone(s, timezone, { month: "short", day: "numeric", year: "numeric" });
  const startTime = formatInTimezone(s, timezone, { hour: "numeric", minute: "2-digit", hour12: true });
  const endTime = formatInTimezone(e, timezone, { hour: "numeric", minute: "2-digit", hour12: true });

  // Uses unicode middle dot and en-dash for clean typography
  return `${dateStr} \u00B7 ${startTime} \u2013 ${endTime}`;
}

// Formats just the time portion: "3:00 PM"
export function formatTime(date: Date | string, timezone?: string | null): string {
  return formatInTimezone(date, timezone, { hour: "numeric", minute: "2-digit", hour12: true });
}

// Formats just the date portion: "Jan 1, 2026"
export function formatDate(date: Date | string, timezone?: string | null): string {
  return formatInTimezone(date, timezone, { month: "short", day: "numeric", year: "numeric" });
}

// Maps IANA timezone names to short display labels for UI badges
// Only covers US timezones since the platform is US-only
export function getTimezoneLabel(timezone: string | null | undefined): string {
  if (!timezone) return "";
  const labels: Record<string, string> = {
    "America/New_York": "ET",
    "America/Chicago": "CT",
    "America/Denver": "MT",
    "America/Los_Angeles": "PT",
    "America/Anchorage": "AKT",
    "Pacific/Honolulu": "HT",
  };
  return labels[timezone] || "";
}
