export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import { getShiftById } from "@/actions/shifts";
import { StatusBadge } from "@/components/shared/status-badge";
import { StarDisplay } from "@/components/shared/star-display";
import { AcceptShiftButton } from "@/components/worker/accept-shift-button";
import { RatingPrompt } from "@/components/shared/rating-prompt";
import { ShiftMessages } from "@/components/shared/shift-messages";
import { WORKER_FEE_PERCENT } from "@/lib/fees";
import {
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  ArrowLeft,
  ExternalLink,
  Briefcase,
  ClipboardList,
  ShieldCheck,
  CheckCircle,
  Zap,
} from "lucide-react";
import { formatInTimezone, getTimezoneLabel } from "@/lib/timezone";

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
  RN: "Registered Nurse",
  LPN: "Licensed Practical Nurse",
  CNA: "Certified Nursing Assistant",
  HHA: "Home Health Aide",
  MEDICAL_ASSISTANT: "Medical Assistant",
  COMPANION: "Companion Caregiver",
  OTHER: "Other",
};

function formatShiftDate(date: Date, timezone?: string | null): string {
  return formatInTimezone(date, timezone, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatShiftTime(date: Date, timezone?: string | null): string {
  return formatInTimezone(date, timezone, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatStartTime(start: Date, timezone?: string | null): string {
  return formatInTimezone(start, timezone, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default async function WorkerShiftDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();

  if (user.role !== "WORKER") {
    notFound();
  }

  // Get user timezone for display
  const userRecord = await db.user.findUnique({
    where: { id: user.id },
    select: { timezone: true },
  });
  const tz = userRecord?.timezone || null;
  const tzLabel = getTimezoneLabel(tz);

  const shift = await getShiftById(id);
  if (!shift) {
    notFound();
  }

  // Get provider rating
  const providerRating = await db.rating.groupBy({
    by: ["rateeId"],
    where: { rateeId: shift.providerId },
    _avg: { score: true },
    _count: true,
  });
  const rating = providerRating[0]
    ? { average: providerRating[0]._avg.score ?? 0, count: providerRating[0]._count }
    : null;

  // Check if worker has rated this shift
  const existingRating = await db.rating.findFirst({
    where: { shiftId: shift.id, raterId: user.id },
  });
  const hasRated = !!existingRating;

  // Check if this shift has clock-in data for this worker
  const clockInEntry = shift.timeEntries?.find(
    (te) => te.clockInTime
  );

  const startDate = new Date(shift.startTime);
  const endDate = new Date(shift.endTime);
  const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  const payRate = parseFloat(String(shift.payRate));
  const shiftTotal = payRate * hours;
  const serviceFee = shiftTotal * WORKER_FEE_PERCENT;
  const workerReceives = shiftTotal - serviceFee;

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

  const isAssignedToMe = shift.assignedWorkerId === user.id;
  const isOpen = shift.status === "OPEN";
  const isCompleted = shift.status === "COMPLETED";

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shift.location)}`;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Back link */}
      <Link
        href="/worker/shifts"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Available Shifts
      </Link>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Top accent */}
        <div className={`h-1.5 w-full ${roleColor.bg}`} />

        <div className="p-6 sm:p-8 space-y-6">
          {/* Row 1: Role badge + Pay rate */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-semibold ${roleColor.bg} ${roleColor.text}`}
              >
                {roleLabel}
              </span>
              {shift.status !== "OPEN" && (
                <StatusBadge status={shift.status} />
              )}
              {(shift as Record<string, unknown>).payCadence === "SAME_DAY" && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg px-2.5 py-1 text-xs font-semibold">
                  <Zap className="h-3.5 w-3.5" />
                  Same Day Pay
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-slate-900 leading-none">
                ${payRate.toFixed(0)}
                <span className="text-base font-medium text-slate-400">/hr</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                You earn ${(payRate * (1 - WORKER_FEE_PERCENT)).toFixed(0)}/hr after fees
              </p>
            </div>
          </div>

          {/* Shift title */}
          {shift.title && (
            <h1 className="text-xl font-bold text-slate-900">{shift.title}</h1>
          )}

          {/* Employer info */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Briefcase className="h-5 w-5 text-slate-400" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-base font-semibold text-slate-900">{companyName}</p>
              {isPrivatePayer && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-violet-100 text-violet-700">
                  Private Client
                </span>
              )}
              {!isPrivatePayer && shift.provider?.providerProfile?.companyName && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-cyan-600">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
              )}
              {rating && (
                <StarDisplay average={rating.average} count={rating.count} size="md" />
              )}
            </div>
          </div>

          {/* Private payer care context */}
          {isPrivatePayer && (providerDesc || privateLocationLabel) && (
            <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-violet-900 flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-violet-400" />
                About This Private Client
              </h3>
              {providerDesc && (
                <p className="text-sm text-slate-600 leading-relaxed">{providerDesc}</p>
              )}
              {privateLocationLabel && (
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                  Care location: {privateLocationLabel}
                </p>
              )}
            </div>
          )}

          {/* Details grid */}
          <div className="space-y-4 bg-slate-50 rounded-xl p-5">
            {/* Location */}
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-700">Location</p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-cyan-600 hover:text-cyan-700 hover:underline inline-flex items-center gap-1 mt-0.5"
                >
                  {shift.location}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-700">Date</p>
                <p className="text-sm text-slate-600 mt-0.5">
                  {formatShiftDate(startDate, tz)}
                </p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-700">Time</p>
                <p className="text-sm text-slate-600 mt-0.5">
                  {formatShiftTime(startDate, tz)} - {formatShiftTime(endDate, tz)}
                  {tzLabel && <span className="text-slate-400 ml-1">{tzLabel}</span>}
                  {" "}
                  <span className="text-slate-400">({hours.toFixed(1)} hours)</span>
                </p>
              </div>
            </div>
          </div>

          {/* Description/Notes */}
          {(shift.description || shift.notes) && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                Description
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {shift.description || shift.notes}
              </p>
            </div>
          )}

          {/* Requirements */}
          {shift.requirements && shift.requirements.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                <ClipboardList className="h-4 w-4 text-slate-400" />
                Requirements
              </h3>
              <ul className="space-y-1.5">
                {shift.requirements.map((req: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Minimum experience */}
          {shift.minExperience != null && shift.minExperience > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-medium text-amber-800">
                Minimum {shift.minExperience} year{shift.minExperience > 1 ? "s" : ""} of experience required
              </p>
            </div>
          )}

          {/* Pay breakdown — Fiverr-style */}
          <div className="bg-slate-50 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-slate-400" />
              Pay Breakdown
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Shift total ({hours.toFixed(1)}h)</span>
                <span className="font-medium">${shiftTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>Service fee ({(WORKER_FEE_PERCENT * 100).toFixed(0)}%)</span>
                <span>-${serviceFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-base font-bold text-emerald-700">
                <span>You&apos;ll receive</span>
                <span>${workerReceives.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-500 pt-1">
                <span>Pay cadence</span>
                {(shift as Record<string, unknown>).payCadence === "SAME_DAY" ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-sm">
                    <Zap className="h-3.5 w-3.5" />
                    Same Day
                  </span>
                ) : (
                  <span className="font-medium">Biweekly</span>
                )}
              </div>
            </div>
          </div>

          {/* Clock-in info for assigned shifts */}
          {isAssignedToMe && clockInEntry && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900">Clocked In</p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    {formatInTimezone(new Date(clockInEntry.clockInTime), tz, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                    {clockInEntry.clockInStatus === "OFF_SITE" && " (Off-site)"}
                    {clockInEntry.distanceMiles != null &&
                      ` - ${parseFloat(String(clockInEntry.distanceMiles)).toFixed(1)} mi from location`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2">
            {/* OPEN shift: Accept button */}
            {isOpen && (
              <AcceptShiftButton
                shiftId={shift.id}
                location={shift.location}
                startTime={formatStartTime(startDate, tz)}
              />
            )}

            {/* ASSIGNED to me: cancel button */}
            {isAssignedToMe && (shift.status === "ASSIGNED" || shift.status === "IN_PROGRESS") && (
              <div className="space-y-3">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-sm font-semibold text-emerald-800">
                    This shift is assigned to you
                  </p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Make sure to arrive on time and clock in when you get there.
                  </p>
                </div>
                <Link
                  href="/worker/my-shifts"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-600 hover:text-cyan-700 transition-colors"
                >
                  View in My Shifts
                  <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                </Link>
              </div>
            )}

            {/* COMPLETED: Rating prompt if not yet rated */}
            {isCompleted && isAssignedToMe && !hasRated && (
              <RatingPrompt
                shiftId={shift.id}
                rateeName={companyName}
                rateeRole="employer"
              />
            )}

            {/* COMPLETED and already rated */}
            {isCompleted && isAssignedToMe && hasRated && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <p className="text-sm font-semibold text-emerald-800">
                    Shift completed. You&apos;ve submitted your rating.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Messages — visible when assigned to this worker */}
          {isAssignedToMe &&
            (shift.status === "ASSIGNED" ||
              shift.status === "IN_PROGRESS" ||
              shift.status === "COMPLETED") && (
              <ShiftMessages
                shiftId={id}
                currentUserId={user.id}
                initialMessages={
                  (shift.messages ?? []).map((m) => ({
                    id: m.id,
                    content: m.content,
                    createdAt: m.createdAt.toISOString(),
                    sender: { id: m.sender.id, name: m.sender.name, role: m.sender.role || "" },
                  }))
                }
              />
            )}
        </div>
      </div>
    </div>
  );
}
