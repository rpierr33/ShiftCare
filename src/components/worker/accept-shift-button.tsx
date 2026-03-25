"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { acceptShift } from "@/actions/shifts";
import {
  Zap,
  CheckCircle,
  Loader2,
  XCircle,
  ArrowRight,
  MapPin,
  Calendar,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface AcceptShiftButtonProps {
  shiftId: string;
  location: string;
  startTime: string;
}

export function AcceptShiftButton({
  shiftId,
  location,
  startTime,
}: AcceptShiftButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<
    "idle" | "loading" | "confirming" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleAccept() {
    setStatus("loading");
    setErrorMessage(null);

    try {
      // Brief "confirming" state for visual feedback
      await new Promise((r) => setTimeout(r, 300));
      setStatus("confirming");

      const result = await acceptShift(shiftId);

      if (result.success) {
        setStatus("success");
        setTimeout(() => router.refresh(), 3000);
      } else {
        setErrorMessage(result.error || "Failed to accept shift.");
        setStatus("error");
      }
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  // ─── SUCCESS: Rich confirmation ──────────────────────────────
  if (status === "success") {
    return (
      <div className="w-full rounded-xl bg-emerald-50 border-2 border-emerald-300 p-5 space-y-3 animate-scale-in">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-900">
              You&apos;re booked!
            </p>
            <p className="text-xs text-emerald-600">
              This shift is confirmed and assigned to you
            </p>
          </div>
        </div>

        <div className="bg-emerald-100/50 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{startTime}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-600">
            <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Provider has been notified</span>
          </div>
        </div>

        <Link
          href="/worker/my-shifts"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
        >
          View My Shifts
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  // ─── ERROR: Visible with retry ───────────────────────────────
  if (status === "error") {
    return (
      <div className="w-full space-y-3">
        <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-sm font-semibold text-red-800">
              {errorMessage}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={() => {
                setStatus("idle");
                setErrorMessage(null);
              }}
              className="text-sm font-semibold text-red-700 hover:text-red-800 underline underline-offset-2 transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/worker/shifts"
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              Browse other shifts
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── CONFIRMING: Transition state ────────────────────────────
  if (status === "confirming") {
    return (
      <div className="w-full">
        <div className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-600/30">
          <Sparkles className="h-4 w-4 animate-pulse" />
          Confirming your shift...
          <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        </div>
      </div>
    );
  }

  // ─── LOADING: Processing ─────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="w-full">
        <div className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white">
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing...
        </div>
      </div>
    );
  }

  // ─── IDLE: Primary CTA ───────────────────────────────────────
  return (
    <div className="w-full">
      <button
        onClick={handleAccept}
        className="w-full group relative inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-600/25 hover:bg-cyan-500 hover:shadow-xl hover:shadow-cyan-500/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all duration-200"
      >
        <Zap className="h-4 w-4 group-hover:animate-pulse" />
        Accept Shift
        <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
      </button>
    </div>
  );
}
