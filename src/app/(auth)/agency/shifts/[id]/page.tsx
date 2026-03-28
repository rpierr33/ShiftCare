export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Users,
  Shield,
  UserCheck,
  Pencil,
  CheckCircle,
  AlertTriangle,
  Info,
  Banknote,
  Zap,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { StatusBadge, VerifiedBadge } from "@/components/shared/status-badge";
import { StarDisplay } from "@/components/shared/star-display";
import { calculateShiftPayments } from "@/lib/fees";
import { ShiftDetailActions } from "./shift-detail-actions";
import { RatingPrompt } from "@/components/shared/rating-prompt";
import { ShiftMessages } from "@/components/shared/shift-messages";

const ROLE_LABELS: Record<string, string> = {
  RN: "Registered Nurse",
  LPN: "Licensed Practical Nurse",
  CNA: "Certified Nursing Assistant",
  HHA: "Home Health Aide",
  MEDICAL_ASSISTANT: "Medical Assistant",
  COMPANION: "Companion",
  OTHER: "Other",
};

const ROLE_BADGE_COLOR: Record<string, string> = {
  RN: "bg-purple-100 text-purple-700",
  LPN: "bg-indigo-100 text-indigo-700",
  CNA: "bg-teal-100 text-teal-700",
  HHA: "bg-orange-100 text-orange-700",
  MEDICAL_ASSISTANT: "bg-cyan-100 text-cyan-700",
  COMPANION: "bg-pink-100 text-pink-700",
  OTHER: "bg-gray-100 text-gray-700",
};

const ASSIGNMENT_STATUS_BADGE: Record<string, string> = {
  REQUESTED: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
  HELD: "bg-purple-50 text-purple-700 ring-1 ring-purple-600/20",
  ACCEPTED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
  CONFIRMED: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20",
  REJECTED: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
  CANCELLED: "bg-slate-50 text-slate-600 ring-1 ring-slate-500/20",
};

export default async function AgencyShiftDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();

  const shift = await db.shift.findUnique({
    where: { id },
    include: {
      assignedWorker: { select: { name: true, id: true } },
      assignments: {
        include: {
          workerProfile: {
            include: {
              user: { select: { name: true } },
              credentials: { where: { status: "VERIFIED" }, select: { type: true, name: true } },
            },
          },
        },
      },
      shiftPayment: true,
      timeEntries: {
        select: {
          id: true,
          clockInTime: true,
          clockInStatus: true,
          distanceMiles: true,
          clockOutTime: true,
          worker: { select: { name: true } },
        },
      },
    },
  });

  if (!shift || shift.providerId !== user.id) {
    notFound();
  }

  // Query assigned worker's average rating
  let workerRating: { average: number; count: number } | null = null;
  if (shift.assignedWorkerId) {
    const ratings = await db.rating.aggregate({
      where: { rateeId: shift.assignedWorkerId },
      _avg: { score: true },
      _count: true,
    });
    workerRating = { average: ratings._avg.score ?? 0, count: ratings._count };
  }

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const hours = (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60);
  const payRate = parseFloat(String(shift.payRate));
  const providerProfile = await db.providerProfile.findUnique({
    where: { userId: user.id },
    select: { providerType: true, subscription: { select: { plan: true, status: true } } },
  });
  const isSubscribed = providerProfile?.subscription?.status === "ACTIVE" &&
    (providerProfile.subscription.plan === "STARTER" || providerProfile.subscription.plan === "PROFESSIONAL");
  const payments = calculateShiftPayments(payRate, hours, isSubscribed);

  const grossAmount = shift.grossAmount ? parseFloat(String(shift.grossAmount)) : payments.totalCharge;
  const platformFee = shift.platformFeeAmount ? parseFloat(String(shift.platformFeeAmount)) : payments.platformFee;
  const workerPayout = shift.workerPayoutAmount ? parseFloat(String(shift.workerPayoutAmount)) : payments.workerPayout;

  const isAssigned = shift.status === "ASSIGNED";
  const isOpen = shift.status === "OPEN";
  const isCompleted = shift.status === "COMPLETED";

  // Check if provider has already rated this shift
  let providerHasRated = false;
  if (isCompleted) {
    const existingRating = await db.rating.findUnique({
      where: { shiftId_raterId: { shiftId: shift.id, raterId: user.id } },
    });
    providerHasRated = !!existingRating;
  }
  // isCancelled used in JSX conditional below
  const isDisputed = shift.status === "DISPUTED";
  const now = new Date();
  const shiftEnded = now > new Date(shift.endTime);
  const showCompletionUI = isAssigned && shiftEnded;

  // Status timeline steps
  const timelineSteps = [
    { label: "Posted", done: true, date: shift.createdAt },
    { label: "Worker Assigned", done: !!shift.assignedWorkerId, date: shift.assignedAt },
    { label: "Shift Completed", done: isCompleted, date: shift.completionConfirmedAt },
    { label: "Payment Released", done: shift.paymentStatus === "RELEASED", date: shift.completionConfirmedAt },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/agency/shifts"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Shifts
        </Link>
        {(isOpen || isAssigned) && (
          <Link
            href={`/agency/shifts/${shift.id}/edit`}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-cyan-700 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Link>
        )}
      </div>

      {/* Shift Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
        <div className="h-1.5 bg-gradient-to-r from-cyan-500 to-cyan-600" />
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${ROLE_BADGE_COLOR[shift.role] ?? "bg-gray-100 text-gray-700"}`}>
                  {shift.role}
                </span>
                <StatusBadge status={shift.status} variant="pill" />
                {shift.isUrgent && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    URGENT
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-slate-900">
                {shift.title || `${ROLE_LABELS[shift.role] ?? shift.role} Shift`}
              </h1>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <p className="text-2xl font-bold text-slate-900">
                ${payRate.toFixed(2)}
              </p>
              <p className="text-sm text-slate-500">per hour</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-5 border-t border-slate-100">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Location</p>
                <p className="text-sm font-medium text-slate-900">{shift.location}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Date</p>
                <p className="text-sm font-medium text-slate-900">
                  {dateFormatter.format(new Date(shift.startTime))}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Time</p>
                <p className="text-sm font-medium text-slate-900">
                  {timeFormatter.format(new Date(shift.startTime))} -{" "}
                  {timeFormatter.format(new Date(shift.endTime))}
                  <span className="text-slate-400 ml-1">({hours.toFixed(1)}h)</span>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Total Cost</p>
                <p className="text-sm font-bold text-slate-900">
                  ${grossAmount.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Zap className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Pay Cadence</p>
                {(shift as Record<string, unknown>).payCadence === "SAME_DAY" ? (
                  <p className="text-sm font-semibold text-emerald-700 inline-flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5" />
                    Same Day Pay
                  </p>
                ) : (
                  <p className="text-sm font-medium text-slate-900">Biweekly (Standard)</p>
                )}
              </div>
            </div>
          </div>

          {/* Time Entry: Clock-in / Clock-out for completed/in-progress shifts */}
          {shift.timeEntries && shift.timeEntries.length > 0 && (
            <div className="mt-5 pt-5 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-2">Time Tracking</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Clock-in</p>
                    <p className="text-sm font-medium text-slate-900">
                      {timeFormatter.format(new Date(shift.timeEntries[0].clockInTime))}
                      {shift.timeEntries[0].clockInStatus === "OFF_SITE" && (
                        <span className="ml-1.5 text-xs text-amber-600 font-normal">(Off-site)</span>
                      )}
                    </p>
                  </div>
                </div>
                {shift.timeEntries[0].clockOutTime && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500">Clock-out</p>
                      <p className="text-sm font-medium text-slate-900">
                        {timeFormatter.format(new Date(shift.timeEntries[0].clockOutTime))}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {shift.timeEntries[0].clockOutTime && (
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <span className="text-slate-500">
                    Scheduled: <span className="font-medium text-slate-700">{hours.toFixed(1)}h</span>
                  </span>
                  {(() => {
                    const actualHrs = (shift.timeEntries[0] as { clockOutTime: Date; clockInTime: Date }).clockOutTime
                      ? (new Date(shift.timeEntries[0].clockOutTime!).getTime() - new Date(shift.timeEntries[0].clockInTime).getTime()) / (1000 * 60 * 60)
                      : hours;
                    const diff = Math.abs(actualHrs - hours);
                    return (
                      <span className={diff > 0.1 ? "text-amber-600 font-medium" : "text-slate-500"}>
                        Actual: <span className="font-medium">{actualHrs.toFixed(1)}h</span>
                      </span>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {shift.notes && (
            <div className="mt-5 pt-5 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-1">Notes</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{shift.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">Status Timeline</h2>
        <div className="relative">
          {timelineSteps.map((step, i) => (
            <div key={step.label} className="flex items-start gap-4 relative">
              {/* Connector line */}
              {i < timelineSteps.length - 1 && (
                <div className={`absolute left-[11px] top-6 w-0.5 h-8 ${step.done ? "bg-cyan-500" : "bg-slate-200"}`} />
              )}
              <div className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? "bg-cyan-500" : "bg-slate-200"}`}>
                {step.done ? (
                  <CheckCircle className="h-4 w-4 text-white" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-white" />
                )}
              </div>
              <div className="pb-8">
                <p className={`text-sm font-medium ${step.done ? "text-slate-900" : "text-slate-400"}`}>
                  {step.label}
                </p>
                {step.done && step.date && (
                  <p className="text-xs text-slate-400">
                    {new Date(step.date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assigned Worker */}
      {isAssigned && shift.assignedWorker && (
        <div className="bg-gradient-to-br from-cyan-50 to-emerald-50 rounded-2xl shadow-sm border border-cyan-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="h-5 w-5 text-cyan-600" />
            <h2 className="text-sm font-semibold text-cyan-700 uppercase tracking-wide">Assigned Worker</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-white border-2 border-emerald-400 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-cyan-600">
                {shift.assignedWorker.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{shift.assignedWorker.name}</h3>
                <VerifiedBadge />
              </div>
              {workerRating && workerRating.count > 0 && (
                <StarDisplay average={workerRating.average} count={workerRating.count} />
              )}
              <p className="text-sm text-cyan-600 font-medium">{ROLE_LABELS[shift.role] ?? shift.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Panel */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Banknote className="h-5 w-5 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Payment</h2>
        </div>

        {shift.paymentStatus === "UNPAID" && (
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-700">
              No worker assigned yet. You will be charged{" "}
              <span className="font-bold">${grossAmount.toFixed(2)}</span> when a worker accepts.
            </p>
          </div>
        )}

        {shift.paymentStatus === "HELD" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <span className="font-bold">${grossAmount.toFixed(2)}</span> held by ShiftCare. Released
              to worker after you confirm completion.
            </p>
          </div>
        )}

        {shift.paymentStatus === "RELEASED" && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2">
            <p className="text-sm text-emerald-800">
              Shift completed. <span className="font-bold">${grossAmount.toFixed(2)}</span> paid.
            </p>
            <p className="text-xs text-emerald-600">
              Worker received ${workerPayout.toFixed(2)} after platform fee.
            </p>
          </div>
        )}

        {shift.paymentStatus === "REFUNDED" && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-sm text-slate-700">
              <span className="font-bold">${grossAmount.toFixed(2)}</span> refunded to your payment method.
            </p>
          </div>
        )}
      </div>

      {/* Completion Confirmation UI */}
      {showCompletionUI && (
        <ShiftDetailActions
          shiftId={shift.id}
          workerName={shift.assignedWorker?.name ?? "the worker"}
          workerPayout={workerPayout}
          grossAmount={grossAmount}
        />
      )}

      {/* Cancel action for open/assigned shifts (pre-end time) */}
      {(isOpen || (isAssigned && !shiftEnded)) && (
        <ShiftDetailActions
          shiftId={shift.id}
          workerName={shift.assignedWorker?.name ?? ""}
          workerPayout={workerPayout}
          grossAmount={grossAmount}
          cancelOnly
        />
      )}

      {/* Applicants */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
            Applicants & Assignments
          </h2>
          <span className="text-xs text-slate-400">{shift.assignments.length} total</span>
        </div>

        {shift.assignments.length === 0 ? (
          <div className="text-center py-6">
            <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No applicants yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shift.assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between bg-slate-50 rounded-xl p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center border border-slate-200">
                    <span className="text-xs font-semibold text-slate-600">
                      {assignment.workerProfile.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {assignment.workerProfile.user.name}
                    </p>
                    {assignment.workerProfile.credentials.length > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Shield className="h-3 w-3 text-emerald-500" />
                        <p className="text-xs text-slate-500">
                          {assignment.workerProfile.credentials.map((c) => c.name).join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${ASSIGNMENT_STATUS_BADGE[assignment.status] ?? "bg-gray-100 text-gray-800"}`}>
                  {assignment.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rating prompt for completed shifts */}
      {isCompleted && !providerHasRated && shift.assignedWorker && (
        <div className="mb-6">
          <RatingPrompt
            shiftId={shift.id}
            rateeName={shift.assignedWorker.name}
            rateeRole="worker"
          />
        </div>
      )}

      {/* Messages — visible when a worker is assigned */}
      {shift.assignedWorkerId &&
        (shift.status === "ASSIGNED" ||
          shift.status === "IN_PROGRESS" ||
          shift.status === "COMPLETED") && (
          <div className="mb-6">
            <ShiftMessages
              shiftId={id}
              currentUserId={user.id}
              initialMessages={
                ((shift as { messages?: Array<{ id: string; content: string; createdAt: Date; sender: { id: string; name: string; role: string } }> }).messages ?? []).map((m) => ({
                  id: m.id,
                  content: m.content,
                  createdAt: m.createdAt.toISOString(),
                  sender: m.sender,
                }))
              }
            />
          </div>
        )}

      {/* Disputed notice */}
      {isDisputed && shift.disputeReason && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-900">Dispute Filed</h3>
              <p className="text-sm text-red-800 mt-1">{shift.disputeReason}</p>
              <p className="text-xs text-red-600 mt-2">Our team will review this within 24-48 hours.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
