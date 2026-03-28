/**
 * Format a date in the user's timezone.
 * Falls back to the date's default display if no timezone set.
 */
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

  return `${dateStr} \u00B7 ${startTime} \u2013 ${endTime}`;
}

export function formatTime(date: Date | string, timezone?: string | null): string {
  return formatInTimezone(date, timezone, { hour: "numeric", minute: "2-digit", hour12: true });
}

export function formatDate(date: Date | string, timezone?: string | null): string {
  return formatInTimezone(date, timezone, { month: "short", day: "numeric", year: "numeric" });
}

// Short timezone label for display: "ET", "CT", "PT", etc.
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
