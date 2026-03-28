export const dynamic = "force-dynamic";

import Link from "next/link";
import { getAvailableShifts, getWorkerRecommendationContext } from "@/actions/shifts";
import { getTopPicks } from "@/lib/matching";
import { AcceptShiftButton } from "@/components/worker/accept-shift-button";
import { RoleFilter } from "@/components/worker/role-filter";
import { ViewToggle } from "@/components/worker/view-toggle";
import { ShiftFilters } from "@/components/worker/shift-filters";
import { ShiftSearch } from "@/components/worker/shift-search";
import { AutoRefresh } from "@/components/worker/auto-refresh";
import { ShiftMap } from "@/components/shared/shift-map";
import { VerifiedBadge } from "@/components/shared/status-badge";
import { StarDisplay } from "@/components/shared/star-display";
import { MapPin, Calendar, Clock, UserCheck, Flame, Zap, Sparkles } from "lucide-react";
import type { WorkerRole } from "@prisma/client";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import { formatShiftDateTime as formatShiftDateTimeTz, getTimezoneLabel } from "@/lib/timezone";

// Removed: inline formatShiftDateTime — now using timezone-aware version from @/lib/timezone

function formatStartTime(start: Date, timezone?: string | null): string {
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
  if (timezone) {
    return new Intl.DateTimeFormat("en-US", { ...opts, timeZone: timezone }).format(start);
  }
  return new Intl.DateTimeFormat("en-US", opts).format(start);
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

function startsWithin24Hours(start: Date): boolean {
  const now = new Date();
  const diffMs = start.getTime() - now.getTime();
  return diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000;
}

function startsWithin48Hours(start: Date): boolean {
  const now = new Date();
  const diffMs = start.getTime() - now.getTime();
  return diffMs > 0 && diffMs <= 48 * 60 * 60 * 1000;
}

function getCountdown(start: Date): string | null {
  const now = new Date();
  const diffMs = start.getTime() - now.getTime();
  if (diffMs <= 0 || diffMs > 48 * 60 * 60 * 1000) return null;
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `Starts in ${hours}h ${minutes}m`;
}

function getUrgencyScore(shift: { startTime: Date | string; createdAt: Date | string }, index: number): number {
  const start = new Date(shift.startTime);
  const now = new Date();
  const diffMs = start.getTime() - now.getTime();
  const hoursUntilStart = diffMs / (1000 * 60 * 60);

  let score = 0;
  if (hoursUntilStart <= 24 && hoursUntilStart > 0) score += 100;
  else if (hoursUntilStart <= 48 && hoursUntilStart > 0) score += 50;

  // sooner = higher score
  if (hoursUntilStart > 0) score += Math.max(0, 200 - hoursUntilStart);

  return score;
}

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  RN: { bg: "bg-purple-100", text: "text-purple-700" },
  LPN: { bg: "bg-indigo-100", text: "text-indigo-700" },
  CNA: { bg: "bg-teal-100", text: "text-teal-700" },
  HHA: { bg: "bg-orange-100", text: "text-orange-700" },
  MEDICAL_ASSISTANT: { bg: "bg-cyan-100", text: "text-cyan-700" },
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

const VALID_ROLES = ["RN", "LPN", "CNA", "HHA", "MEDICAL_ASSISTANT", "COMPANION", "OTHER"];

export default async function WorkerShiftsPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; view?: string; minPay?: string; maxPay?: string; minHours?: string; maxHours?: string; maxDistance?: string; q?: string }>;
}) {
  const params = await searchParams;
  const view = params.view;
  const roleFilter = params.role && VALID_ROLES.includes(params.role)
    ? (params.role as WorkerRole)
    : undefined;

  // Get user timezone for display
  const user = await getSessionUser();
  const userRecord = await db.user.findUnique({
    where: { id: user.id },
    select: { timezone: true },
  });
  const tz = userRecord?.timezone || null;
  const tzLabel = getTimezoneLabel(tz);

  const allShifts = await getAvailableShifts(roleFilter ? { role: roleFilter } : undefined);

  // Apply client-side filters (pay range, duration)
  const minPay = params.minPay ? parseFloat(params.minPay) : null;
  const maxPay = params.maxPay ? parseFloat(params.maxPay) : null;
  const minHours = params.minHours ? parseFloat(params.minHours) : null;
  const maxHours = params.maxHours ? parseFloat(params.maxHours) : null;
  const maxDistance = params.maxDistance ? parseFloat(params.maxDistance) : null;

  const searchQuery = params.q?.toLowerCase();

  let shifts = allShifts.filter((s) => {
    const rate = parseFloat(String(s.payRate));
    if (minPay !== null && rate < minPay) return false;
    if (maxPay !== null && rate > maxPay) return false;
    const duration = (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / (1000 * 60 * 60);
    if (minHours !== null && duration < minHours) return false;
    if (maxHours !== null && duration > maxHours) return false;
    // Distance filter
    if (maxDistance !== null && s.distanceFromWorker != null && s.distanceFromWorker > maxDistance) return false;
    return true;
  });

  if (searchQuery) {
    shifts = shifts.filter((s) => {
      const companyName = (s.provider?.providerProfile?.companyName || s.provider?.name || "").toLowerCase();
      const location = s.location.toLowerCase();
      const notes = (s.notes || "").toLowerCase();
      const desc = (s.description || "").toLowerCase();
      return companyName.includes(searchQuery) || location.includes(searchQuery) || notes.includes(searchQuery) || desc.includes(searchQuery);
    });
  }

  // Sort by urgency: soonest start + filling fast first
  const sortedShifts = shifts
    .map((shift, index) => ({ shift, originalIndex: index }))
    .sort((a, b) => getUrgencyScore(b.shift, b.originalIndex) - getUrgencyScore(a.shift, a.originalIndex));

  // Get personalized top picks
  const workerContext = await getWorkerRecommendationContext();
  const topPicks = workerContext && shifts.length >= 3
    ? getTopPicks(
        shifts.map((s) => ({
          id: s.id,
          role: s.role,
          location: s.location,
          latitude: s.latitude,
          longitude: s.longitude,
          payRate: s.payRate,
          startTime: new Date(s.startTime),
          endTime: new Date(s.endTime),
          isUrgent: s.isUrgent,
          payCadence: (s as { payCadence?: string }).payCadence || "STANDARD",
          providerId: s.providerId,
          createdAt: new Date(s.createdAt),
        })),
        workerContext,
        3
      )
    : [];
  const topPickIds = new Set(topPicks.map((p) => p.id));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <AutoRefresh />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Available Shifts
            </h1>
            {shifts.length > 0 && (
              <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Live
                <span className="sr-only">Updates every 30s</span>
              </div>
            )}
          </div>
          <p className="mt-1.5 text-sm text-slate-500">
            {shifts.length > 0
              ? "New shifts are posted every few minutes. Updates every 30s."
              : "Accept shifts near you \u2014 first come, first served"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ShiftSearch />
          <RoleFilter currentRole={roleFilter} />
          <ShiftFilters />
          <ViewToggle />
        </div>
      </div>

      {/* Map View */}
      {view === "map" && shifts.length > 0 && (
        <ShiftMap
          shifts={shifts
            .filter((s) => s.latitude && s.longitude)
            .map((s) => ({
              id: s.id,
              role: s.role,
              title: s.title,
              location: s.location,
              latitude: s.latitude!,
              longitude: s.longitude!,
              payRate: s.payRate,
              startTime: s.startTime.toISOString(),
              endTime: s.endTime.toISOString(),
              providerName:
                s.provider?.providerProfile?.companyName ||
                s.provider?.name ||
                "Employer",
            }))}
        />
      )}

      {/* Top Picks for You */}
      {view !== "map" && topPicks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900">Top Picks for You</h2>
            <span className="text-xs text-slate-400">Based on your profile & history</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topPicks.map((pick) => {
              const shift = shifts.find((s) => s.id === pick.id);
              if (!shift) return null;
              const companyName = shift.provider?.providerProfile?.companyName || shift.provider?.name || "Employer";
              const roleColor = ROLE_COLORS[shift.role] || ROLE_COLORS.OTHER;
              const hours = (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60);
              const payRate = parseFloat(String(shift.payRate));
              const isSameDay = (shift as { payCadence?: string }).payCadence === "SAME_DAY";
              return (
                <div key={shift.id} className="relative bg-gradient-to-br from-amber-50 to-white rounded-2xl border-2 border-amber-200 shadow-sm p-5">
                  <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5 shadow">
                    {Math.round((pick.matchScore / 10))}% match
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-semibold ${roleColor.bg} ${roleColor.text}`}>
                      {ROLE_LABELS[shift.role] || shift.role}
                    </span>
                    {isSameDay && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        <Zap className="h-2.5 w-2.5" /> Same Day
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-900 truncate">{companyName}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{shift.location}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="text-xl font-bold text-slate-900">${payRate.toFixed(0)}<span className="text-sm text-slate-400">/hr</span></p>
                      <p className="text-[10px] text-slate-400">{hours.toFixed(0)}h shift</p>
                    </div>
                    <Link
                      href={`/worker/shifts/${shift.id}`}
                      className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700 transition"
                    >
                      View & Accept
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      {view !== "map" && shifts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-20 px-6 text-center">
          <div className="mb-5">
            <div className="mx-auto h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-slate-300" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            No shifts match your area right now
          </h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
            Complete your profile to get matched faster. Providers look for
            workers with full profiles and up-to-date locations.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/worker/profile"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-600/20 hover:bg-cyan-700 transition-all duration-200"
            >
              <UserCheck className="h-4 w-4" />
              Update Profile
            </Link>
            <Link
              href="/worker/profile#location-section"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 hover:ring-slate-300 transition-all duration-200"
            >
              <MapPin className="h-4 w-4" />
              Expand Location
            </Link>
          </div>
        </div>
      ) : view !== "map" ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sortedShifts.map(({ shift }) => {
            const isPrivatePayer = shift.provider?.providerProfile?.providerType === "PRIVATE";
            const providerDesc = shift.provider?.providerProfile?.description;
            const providerCity = shift.provider?.providerProfile?.city;
            const providerState = shift.provider?.providerProfile?.state;
            const privateLocationLabel = [providerCity, providerState].filter(Boolean).join(", ");
            const companyName = isPrivatePayer
              ? "Private Client"
              : (shift.provider?.providerProfile?.companyName ||
                shift.provider?.name ||
                "Unknown Provider");
            const roleColor = ROLE_COLORS[shift.role] || ROLE_COLORS.OTHER;
            const roleLabel = ROLE_LABELS[shift.role] || shift.role;
            const isUrgent = startsWithin24Hours(new Date(shift.startTime));
            const postedAgo = timeAgo(new Date(shift.createdAt));
            const hasCompanyName = !!shift.provider?.providerProfile?.companyName;
            const countdown = getCountdown(new Date(shift.startTime));
            const payRate = parseFloat(String(shift.payRate));
            const startDate = new Date(shift.startTime);
            const endDate = new Date(shift.endTime);
            const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

            return (
              <div
                key={shift.id}
                className={`group relative bg-white rounded-2xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden ${
                  isUrgent
                    ? "border-amber-300 ring-2 ring-amber-200/60"
                    : "border-slate-100"
                }`}
              >
                {/* Top accent bar */}
                <div className={`h-1 w-full ${isUrgent ? "bg-gradient-to-r from-amber-400 to-red-400" : roleColor.bg}`} />

                {/* Clickable card body — links to detail page */}
                <Link href={`/worker/shifts/${shift.id}`} className="p-5 flex flex-col flex-1 cursor-pointer">
                  {/* Row 1: Role badge + Urgent + Pay rate */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${roleColor.bg} ${roleColor.text}`}>
                        {roleLabel}
                      </span>
                      {isUrgent && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                          URGENT <Flame className="h-3 w-3" />
                        </span>
                      )}
                      {(shift as Record<string, unknown>).payCadence === "SAME_DAY" && (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg px-2 py-0.5 text-[10px] font-semibold">
                          <Zap className="h-3 w-3" />
                          Same Day Pay
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900 leading-none">
                        ${payRate.toFixed(0)}
                        <span className="text-sm font-medium text-slate-400">/hr</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        You earn ${(payRate * 0.9).toFixed(0)}/hr
                      </p>
                    </div>
                  </div>

                  {/* Row 2: Agency name + verified / Private badge + rating */}
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-semibold text-slate-900 truncate">{companyName}</p>
                    {isPrivatePayer ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-violet-100 text-violet-700">
                        Private Family
                      </span>
                    ) : (
                      hasCompanyName && <VerifiedBadge />
                    )}
                    {shift.providerRating && (
                      <StarDisplay
                        average={shift.providerRating.average}
                        count={shift.providerRating.count}
                      />
                    )}
                  </div>
                  {/* Private payer extra context: care type + location */}
                  {isPrivatePayer && (providerDesc || privateLocationLabel) && (
                    <div className="mb-2 space-y-1">
                      {providerDesc && (
                        <p className="text-xs text-slate-500 truncate">
                          {providerDesc.length > 80 ? providerDesc.slice(0, 80) + "..." : providerDesc}
                        </p>
                      )}
                      {privateLocationLabel && (
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          {privateLocationLabel}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Row 3: Date/Time + hours */}
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-1.5">
                    <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <span>
                      {formatShiftDateTimeTz(startDate, endDate, tz)}
                      {tzLabel && <span className="text-slate-400 ml-1">{tzLabel}</span>}
                      <span className="text-slate-400 ml-1">({hours.toFixed(0)} hrs)</span>
                    </span>
                  </div>

                  {/* Row 4: Location + Distance */}
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                    <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{shift.location}</span>
                    {shift.distanceFromWorker != null && (
                      <span className="flex-shrink-0 text-xs font-medium text-cyan-600 bg-cyan-50 rounded-full px-2 py-0.5">
                        ~{shift.distanceFromWorker.toFixed(1)} mi
                      </span>
                    )}
                  </div>

                  {/* Row 5: Relative timing */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                    <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>
                      Posted {postedAgo}
                      {countdown && <span className="text-amber-600 font-semibold ml-1.5">{countdown}</span>}
                    </span>
                  </div>

                  {/* Notes + Description (1 line truncated each) */}
                  {shift.notes && (
                    <p className="text-xs text-slate-400 truncate mb-1">{shift.notes}</p>
                  )}
                  {shift.description && (
                    <p className="text-xs text-slate-500/70 truncate italic mb-1">{shift.description}</p>
                  )}
                  {(shift.notes || shift.description) && <div className="mb-2" />}

                  {/* Pay breakdown — Fiverr-style */}
                  <div className="bg-slate-50 rounded-lg p-3 mb-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Shift total ({hours.toFixed(1)}h)</span>
                      <span>${(payRate * hours).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Service fee (10%)</span>
                      <span>-${(payRate * hours * 0.1).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-1.5 flex items-center justify-between text-sm font-semibold text-emerald-700">
                      <span>You&apos;ll receive</span>
                      <span>${(payRate * hours * 0.9).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <span>Pay cadence</span>
                      {(shift as Record<string, unknown>).payCadence === "SAME_DAY" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                          <Zap className="h-3 w-3" />
                          Same Day
                        </span>
                      ) : (
                        <span>Biweekly</span>
                      )}
                    </div>
                  </div>

                  {/* View Details link */}
                  <p className="text-xs font-medium text-cyan-600 mb-3">
                    View full details &rarr;
                  </p>
                </Link>

                {/* Accept action — outside the Link to prevent navigation on click */}
                <div className="px-5 pb-5">
                  <AcceptShiftButton
                    shiftId={shift.id}
                    location={shift.location}
                    startTime={formatStartTime(startDate, tz)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
