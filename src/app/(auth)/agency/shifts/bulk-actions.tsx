"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Clock,
  MapPin,
  AlertTriangle,
  ChevronRight,
  Users,
  Copy,
  Loader2,
  X,
} from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { cancelShift } from "@/actions/shifts";
import { useRouter } from "next/navigation";

const ROLE_SHORT: Record<string, string> = {
  RN: "RN",
  LPN: "LPN",
  CNA: "CNA",
  HHA: "HHA",
  MEDICAL_ASSISTANT: "MA",
  COMPANION: "COMP",
  OTHER: "OTH",
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

const PAYMENT_STATUS_BADGE: Record<string, { label: string; classes: string }> = {
  UNPAID: { label: "Awaiting Booking", classes: "bg-slate-100 text-slate-600 ring-1 ring-slate-200" },
  HELD: { label: "Payment Held", classes: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  RELEASED: { label: "Paid Out", classes: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  REFUNDED: { label: "Refunded", classes: "bg-slate-100 text-slate-500 ring-1 ring-slate-200" },
};

type ShiftData = {
  id: string;
  role: string;
  title: string | null;
  isUrgent: boolean;
  startTime: string;
  endTime: string;
  location: string;
  payRate: string;
  paymentStatus: string;
  status: string;
  assignedWorkerName: string | null;
};

export function BulkShiftActions({ shifts }: { shifts: ShiftData[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cancelling, startCancelling] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const cancellableStatuses = new Set(["OPEN", "ASSIGNED", "PENDING"]);
  const selectedCancellable = shifts.filter(
    (s) => selected.has(s.id) && cancellableStatuses.has(s.status)
  );

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === shifts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(shifts.map((s) => s.id)));
    }
  }

  function handleBulkCancel() {
    if (selectedCancellable.length === 0) return;
    if (
      !confirm(
        `Cancel ${selectedCancellable.length} shift${selectedCancellable.length !== 1 ? "s" : ""}? This cannot be undone.`
      )
    )
      return;

    setError(null);
    startCancelling(async () => {
      const errors: string[] = [];
      for (const shift of selectedCancellable) {
        const result = await cancelShift(shift.id);
        if (!result.success) {
          errors.push(`${shift.title || shift.role}: ${result.error}`);
        }
      }
      if (errors.length > 0) {
        setError(`Failed to cancel ${errors.length} shift(s): ${errors[0]}`);
      }
      setSelected(new Set());
      router.refresh();
    });
  }

  function buildDuplicateUrl(shift: ShiftData) {
    const params = new URLSearchParams({
      role: shift.role,
      location: shift.location,
      payRate: shift.payRate,
      startTime: new Date(shift.startTime).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      endTime: new Date(shift.endTime).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    });
    return `/agency/shifts/new?${params.toString()}`;
  }

  return (
    <div>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-3 mb-4">
          <span className="text-sm font-medium text-cyan-800">
            {selected.size} selected
          </span>
          {selectedCancellable.length > 0 && (
            <button
              onClick={handleBulkCancel}
              disabled={cancelling}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {cancelling ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
              Cancel Selected ({selectedCancellable.length})
            </button>
          )}
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm text-cyan-600 hover:text-cyan-800 ml-auto"
          >
            Clear
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Select all header */}
        <div className="flex items-center gap-3 px-6 py-2 bg-slate-50 border-b border-slate-100">
          <input
            type="checkbox"
            checked={selected.size === shifts.length && shifts.length > 0}
            onChange={toggleAll}
            className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
          />
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Select all
          </span>
        </div>

        <div className="divide-y divide-slate-50">
          {shifts.map((shift) => {
            const paymentBadge =
              PAYMENT_STATUS_BADGE[shift.paymentStatus] ?? PAYMENT_STATUS_BADGE.UNPAID;

            return (
              <div
                key={shift.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors group"
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selected.has(shift.id)}
                  onChange={() => toggleOne(shift.id)}
                  className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 flex-shrink-0"
                />

                {/* Role badge */}
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold flex-shrink-0 ${
                    ROLE_BADGE_COLOR[shift.role] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {ROLE_SHORT[shift.role] ?? shift.role}
                </span>

                {/* Urgent flag */}
                {shift.isUrgent && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 flex-shrink-0">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    URGENT
                  </span>
                )}

                {/* Details — clickable link */}
                <Link
                  href={`/agency/shifts/${shift.id}`}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {shift.title || `${shift.role} Shift`}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(shift.startTime).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      {new Date(shift.startTime).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {" - "}
                      {new Date(shift.endTime).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {shift.location.split(",")[0]}
                    </span>
                  </div>
                </Link>

                {/* Pay */}
                <p className="text-sm font-bold text-emerald-600 flex-shrink-0">
                  ${parseFloat(shift.payRate).toFixed(0)}/hr
                </p>

                {/* Payment status */}
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${paymentBadge.classes}`}
                >
                  {paymentBadge.label}
                </span>

                {/* Shift status */}
                <StatusBadge status={shift.status} variant="pill" />

                {/* Assigned worker */}
                {shift.assignedWorkerName && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-600 flex-shrink-0">
                    <Users className="h-3 w-3" />
                    {shift.assignedWorkerName.split(" ")[0]}
                  </span>
                )}

                {/* Duplicate button */}
                <Link
                  href={buildDuplicateUrl(shift)}
                  title="Duplicate this shift"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors flex-shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Link>

                {/* Chevron */}
                <Link
                  href={`/agency/shifts/${shift.id}`}
                  className="flex-shrink-0"
                >
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-cyan-600 transition-colors" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
